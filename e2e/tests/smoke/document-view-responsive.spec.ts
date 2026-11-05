// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { showLayoutPane } from '../../helpers/layout-pane';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { waitForDocumentLayoutIrReady } from '../../helpers/wait-for-layout-ir';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const LONG_TITLE =
  'Lohnsteuerbescheinigung 2025 Arbeitgeber Nordwind Logistik GmbH & Co. KG – Korrigierte Fassung vom Oktober';

const NARROW_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

async function createLongTitleDocument(request: APIRequestContext): Promise<string> {
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%E2E_VIEW_RESPONSIVE=${randomUUID()}\n`, 'utf8'),
  ]);
  const create = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: { name: 'view-responsive.pdf', mimeType: 'application/pdf', buffer: pdf },
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const created = (await create.json()) as { id: string };
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, created.id);
  const patch = await request.patch(`${apiBase}/v1/documents/${created.id}`, {
    headers: { origin: webOrigin },
    data: { title: LONG_TITLE },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  return created.id;
}

async function openDocument(page: Page, docId: string): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
}

/** The element is rendered and lies fully inside the viewport horizontally. */
async function expectWithinViewportWidth(page: Page, locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box).not.toBeNull();
  if (box) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 0.5);
  }
}

async function titleLineCount(page: Page): Promise<number> {
  return page.locator('.document-detail-title').evaluate((el) => {
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
    return Math.round(el.getBoundingClientRect().height / lineHeight);
  });
}

test.describe('document view at small widths', () => {
  test.describe.configure({ timeout: 360_000 });

  let docId = '';

  test.beforeAll(async ({ request }) => {
    docId = await createLongTitleDocument(request);
  });

  test.afterAll(async ({ request }) => {
    if (docId) {
      await request.delete(`${apiBase}/v1/documents/${docId}`, { headers: { origin: webOrigin } });
    }
  });

  for (const viewport of NARROW_VIEWPORTS) {
    test(`${String(viewport.width)}px: title wraps, actions and tools stay reachable, panes switch`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openDocument(page, docId);

      const title = page.locator('.document-detail-title');
      await expect(title).toHaveText(LONG_TITLE);
      await expect(title).toHaveAttribute('title', /^Lohnsteuerbescheinigung 2025 .* vom Oktober/);
      expect(await titleLineCount(page)).toBe(2);
      await expectWithinViewportWidth(page, page.locator('.document-detail-download'));
      await expectWithinViewportWidth(
        page,
        page.locator('.document-detail-meta-actions').getByRole('button').last()
      );

      await expect(page.locator('.layout-workspace')).toHaveAttribute(
        'data-mobile-pane',
        'document'
      );
      await expect(page.locator('.layout-side-panel')).toBeHidden();
      const rect = page.getByRole('radio', { name: /Rechteck|Rectangle/i });
      await expectWithinViewportWidth(page, rect);
      await rect.click();
      await expect(rect).toBeChecked();
      const stage = await page.locator('.layout-viewer-stage').boundingBox();
      expect(stage?.height ?? 0).toBeGreaterThanOrEqual(viewport.height * 0.5);
      await assertNoHorizontalOverflow(page);

      await showLayoutPane(page, 'panel');
      await expect(page.locator('.layout-viewer-card')).toBeHidden();
      await expect(page.locator('.layout-side-panel')).toBeVisible();
      await assertNoHorizontalOverflow(page);

      await page.getByTestId('field-value-row-select').first().click();
      const sheet = page.getByTestId('field-correction-sheet');
      await expect(sheet).toBeVisible();
      await sheet.getByRole('button', { name: 'Im Dokument markieren' }).click();
      await expect(page.locator('.layout-workspace')).toHaveAttribute(
        'data-mobile-pane',
        'document'
      );
      await expect(page.getByTestId('field-mark-hint')).toBeVisible();
      await expect(rect).toBeChecked();
      await assertNoHorizontalOverflow(page);
    });
  }

  test('1280px: viewer and panel side by side, no pane tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openDocument(page, docId);
    await expect(page.locator('.layout-pane-tabs')).toHaveCount(0);
    await expect(page.locator('.layout-workspace')).not.toHaveAttribute('data-mobile-pane', /.+/);
    await expect(page.locator('.layout-viewer-card')).toBeVisible();
    await expect(page.locator('.layout-side-panel')).toBeVisible();
    expect(await titleLineCount(page)).toBe(1);
    await expectWithinViewportWidth(page, page.locator('.document-detail-download'));
    await assertNoHorizontalOverflow(page);
  });
});
