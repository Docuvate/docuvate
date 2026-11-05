// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Structuring journey: dashboard hub → library stage tabs → viewer next action → export → review,
 * plus empty / error states, mobile layout and axe (WCAG A/AA) on the redesigned screens.
 *
 * Synthetic mocks only (structuringMocks.ts):
 *   pnpm --filter @docuvate/e2e exec playwright test --config=playwright.structuring.config.ts
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import path from 'node:path';

import { collectUndersizedTouchTargetsInPage } from '../helpers/browser-layout-scans';
import { installStructuringMocks, type StructuringMockLog } from './structuringMocks';

const SYNTHETIC_PDF = path.join(__dirname, '..', '..', 'fixtures', 'synthetic-upload.pdf');

function lastCall(log: StructuringMockLog, prefix: string): string | undefined {
  return [...log.calls].reverse().find((call) => call.startsWith(prefix));
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectNoBlockingAxe(page: Page, label: string) {
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .include('#root')
    // Known, pre-existing: the PDF canvas scroller is not keyboard-focusable (PdfViewer, not part
    // of this redesign). Everything else on the viewer is scanned.
    .exclude('.pdf-viewer-scroll')
    .analyze();
  const blocking = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    blocking.map(
      (v) =>
        `${v.id}: ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ')}`
    ),
    label
  ).toEqual([]);
}

test.describe('structuring journey', () => {
  test.describe.configure({ timeout: 120_000 });

  test('upload → structure → review → export across dashboard, library and viewer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page);

    // Dashboard: mission, primary upload, pipeline counts and prioritized next steps.
    await page.goto('/');
    const hero = page.locator('.structuring-hero');
    await expect(hero.getByRole('heading', { level: 1 })).toHaveText(
      'Aus Dokumenten werden Daten.'
    );
    const rail = page.getByRole('navigation', { name: 'Strukturierungs-Pipeline' });
    await expect(rail.locator('[data-stage]')).toHaveCount(4);
    await expect(rail.locator('[data-stage="review"] .pipeline-rail-count')).toHaveText('3');
    await expect(rail.locator('[data-stage="upload"] .pipeline-rail-count')).toHaveText('2');
    await expect(rail.locator('[data-stage="export"] .pipeline-rail-count')).toHaveText('8');
    const tasks = page.locator('.pipeline-task');
    await expect(tasks.first()).toHaveAttribute('data-task', 'review');
    await expect(tasks).toHaveCount(5);
    await expect(hero.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');

    // Upload is the primary action and really enqueues the file.
    const chooser = page.waitForEvent('filechooser');
    await hero.getByRole('button', { name: 'Hochladen' }).click();
    await (await chooser).setFiles(SYNTHETIC_PDF);
    await expect.poll(() => lastCall(log, 'POST /documents')).toBeTruthy();

    // Failed task → library filtered to the failed step.
    await page.locator('.pipeline-task[data-task="failed"]').getByRole('link').click();
    await expect(page).toHaveURL(/filter=status%3Aerror/);
    const failedTab = page.locator('[data-stage-tab="failed"]');
    await expect(failedTab).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: 'Kontoauszug September' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Stromrechnung Oktober' })).toHaveCount(0);

    // Stage tab "Zu prüfen" maps onto the inbox filter.
    await page.locator('[data-stage-tab="review"]').click();
    await expect(page.locator('[data-stage-tab="review"]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => lastCall(log, 'GET /documents?')).toContain('inbox=true');
    await expect(page.getByRole('link', { name: 'Kontoauszug September' }).first()).toBeVisible();
    await expect(page.locator('.library-col-status .pipeline-pill--review').first()).toBeVisible();

    // Export menu states its scope before the format is picked.
    await page.locator('[data-stage-tab="all"]').click();
    await page.getByRole('button', { name: 'Feldwerte exportieren' }).click();
    await expect(page.getByText('Feldwerte aller Dokumente dieser Ansicht')).toBeVisible();
    const libraryDownload = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: /CSV/ }).click();
    expect((await libraryDownload).suggestedFilename()).toMatch(/^docuvate-field-values-.*\.csv$/);
    expect(lastCall(log, 'GET /documents/export')).toContain('format=csv');

    // Viewer: stage track + next best action for a document waiting for review.
    await page.goto('/documents/synthetic-doc-0001');
    const track = page.getByRole('list', { name: 'Fortschritt dieses Dokuments' });
    await expect(track.locator('[aria-current="step"]')).toHaveAttribute('data-stage', 'review');
    await expect(track.locator('[data-step-status="done"]')).toHaveCount(2);
    const next = page.locator('.pipeline-doc-header');
    await expect(next).toContainText('Prüfen und bestätigen');
    await expect(next).toContainText('1 Feld mit niedriger Sicherheit.');
    await next.getByRole('button', { name: 'Felder prüfen' }).click();
    await expect(page.locator('#document-detail-panel-details')).toBeVisible();
    await next.getByRole('button', { name: 'Labels prüfen' }).click();
    await expect(page.locator('#document-detail-panel-labels')).toBeVisible();

    // Viewer: a structured document exports exactly its own field values.
    await page.goto('/documents/synthetic-doc-0007');
    await expect(page.locator('.pipeline-doc-header')).toHaveAttribute(
      'data-stage-state',
      'structured'
    );
    const docDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Als CSV exportieren' }).click();
    expect((await docDownload).suggestedFilename()).toMatch(/\.csv$/);
    expect(lastCall(log, 'GET /documents/export')).toContain('ids=synthetic-doc-0007');

    // Viewer: a failed document offers the real requeue.
    await page.goto('/documents/synthetic-doc-0006');
    await expect(page.locator('.pipeline-doc-header')).toHaveAttribute(
      'data-stage-state',
      'failed'
    );
    await page
      .locator('.pipeline-doc-header')
      .getByRole('button', { name: 'Erneut verarbeiten' })
      .click();
    await expect
      .poll(() => lastCall(log, 'POST /documents/synthetic-doc-0006/extraction/requeue'))
      .toBeTruthy();

    // Review: dashboard → review queue → one-click accept.
    await page.goto('/');
    await page.locator('.pipeline-task[data-task="review"]').getByRole('link').click();
    await expect(page).toHaveURL(/\/review$/);
    const before = log.calls.length;
    await page.getByRole('button', { name: 'Übernehmen', exact: true }).click();
    await expect
      .poll(() => log.calls.slice(before).some((call) => !call.startsWith('GET ')))
      .toBe(true);

    expect(log.unmatched).toEqual([]);
  });

  test('empty workspace shows onboarding with upload first', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await installStructuringMocks(page, { empty: true });
    await page.goto('/');
    await expect(page.locator('.dashboard-onboarding')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dateien auswählen' }).first()).toBeVisible();
    await page.goto('/documents');
    await expect(page.locator('.library-page')).toBeVisible();
    await expect(page.locator('[data-stage-tab="all"] .library-stage-tab-count')).toHaveText('0');
  });

  test('dashboard load failure shows a retry instead of an empty hub', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page, { statsError: true });
    await page.goto('/');
    const error = page.locator('.dashboard-load-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Die Übersicht konnte nicht geladen werden.');
    const before = log.calls.filter((call) => call.startsWith('GET /dashboard/statistics')).length;
    await error.getByRole('button', { name: 'Erneut versuchen' }).click();
    await expect
      .poll(() => log.calls.filter((call) => call.startsWith('GET /dashboard/statistics')).length)
      .toBeGreaterThan(before);
  });

  test('library list failure keeps the pipeline chrome usable', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await installStructuringMocks(page, { listError: true });
    await page.goto('/documents');
    await expect(page.locator('.library-stage-tabs')).toBeVisible();
    await expect(page.locator('.library-page [role="alert"]').first()).toBeVisible();
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const viewport of [
      { id: 'desktop', width: 1440, height: 900 },
      { id: 'mobile', width: 390, height: 844 },
    ] as const) {
      test(`a11y + layout · ${viewport.id} · ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await installStructuringMocks(page, { theme });
        for (const [route, ready] of [
          ['/', '.structuring-hero'],
          ['/documents', '.library-stage-tabs'],
          ['/documents/synthetic-doc-0001', '.pipeline-doc-header'],
          ['/documents/synthetic-doc-0006', '.pipeline-doc-header'],
        ] as const) {
          await page.goto(route);
          await page.locator(ready).first().waitFor({ state: 'visible', timeout: 60_000 });
          await expect(page.locator('html')).toHaveAttribute('data-docuvate-theme', theme);
          await expectNoBlockingAxe(page, `${route} ${viewport.id} ${theme}`);
          await expectNoHorizontalOverflow(page);
          if (viewport.id === 'mobile') {
            const violations = await page
              .locator(ready)
              .first()
              .evaluate(collectUndersizedTouchTargetsInPage);
            expect(violations, `${route}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
          }
        }
      });
    }
  }
});
