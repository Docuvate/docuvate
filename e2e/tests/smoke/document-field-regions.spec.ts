// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { assignLongLabels, longLabelNames } from '../../helpers/long-label-fixture';
import {
  assertCorrectionsBottomSheet,
  assertFieldRegionRenderedWithValue,
  assertLongLabelChipsTruncateWithTooltip,
  assertNoClippedOrOverlappingChips,
  assertNoHorizontalOverflow,
  assertOverflowMissesHeader,
  captureLoadedScreenshot,
  captureViewportScreenshot,
} from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportSpec[] = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
];

const COLOR_SCHEMES: ('light' | 'dark')[] = ['light', 'dark'];

async function applyGermanLocale(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/');
  await applyDocuvateLocale(page, 'de');
}

async function setLabelsTabOpen(page: Page, open: boolean): Promise<void> {
  const tab = page.getByRole('tab', { name: /^Labels/i });
  const selected = (await tab.getAttribute('aria-selected')) === 'true';
  if (selected !== open) {
    await tab.click();
  }
}

async function startRectangle(page: Page): Promise<void> {
  const word = page.locator('.pdf-page-wrap .textLayer span').filter({ hasText: /Widget/i }).first();
  if ((await word.count()) > 0) {
    await expect(word).toBeVisible({ timeout: 60_000 });
    const box = await word.boundingBox();
    expect(box).toBeTruthy();
    if (!box) {
      return;
    }
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 80, box.y + box.height + 24);
    return;
  }
  const canvas = page.locator('.pdf-page-canvas').first();
  await expect(canvas).toBeVisible({ timeout: 180_000 });
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width * 0.04, box.y + box.height * 0.12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.22);
}

async function finishRectangle(page: Page): Promise<void> {
  await page.mouse.up();
}

test.describe('document field regions', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  let layoutDocId: string;
  const labels = longLabelNames(25);

  test.beforeAll(async ({ request }) => {
    layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
    await assignLongLabels(request, apiBase, webOrigin, layoutDocId, labels);
  });

  test.afterAll(async ({ request }) => {
    if (!layoutDocId) {
      return;
    }
    await request.delete(`${apiBase}/v1/documents/${layoutDocId}`, {
      headers: { origin: webOrigin },
    });
  });

  test('overflow, chips, bottom sheet, rectangle, and source chip', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyGermanLocale(page);
    await openLayoutDocumentPage(page, layoutDocId);

    await page.locator('.layout-side-tabs').getByRole('tab', { name: /Übersicht|Overview/i }).click();
    await expect(page.getByTestId('document-selection-layer')).toHaveAttribute(
      'data-token-count',
      /^(?!0$)\d+$/,
      { timeout: 60_000 }
    );
    await page.getByRole('radio', { name: /Rechteck|Rectangle/i }).click();
    await startRectangle(page);
    await expect(page.getByTestId('document-selection-rect')).toBeVisible({ timeout: 15_000 });
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-before-rectangle.png'
    );
    await finishRectangle(page);

    const bar = page.getByTestId('field-context-bar');
    await expect(bar).toBeVisible({ timeout: 30_000 });
    await bar.getByRole('button', { name: /Feld anlegen|Create field/i }).click();
    await expect(page.getByText(/Korrektur gespeichert|Correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('.source-chip')).toContainText('Seite 1');
    await assertFieldRegionRenderedWithValue(page);
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-after-rectangle.png'
    );
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-source-chip-seite-1.png'
    );

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const scheme of COLOR_SCHEMES) {
        await page.emulateMedia({ colorScheme: scheme });
        await setLabelsTabOpen(page, false);
        await page.locator('.layout-side-tabs').getByRole('tab', { name: /Übersicht|Overview/i }).click();
        if (viewport.width < 1024) {
          const sheet = page.locator('[data-testid="field-correction-sheet"]');
          if ((await sheet.count()) === 0) {
            await page.locator('.pdf-layout-overlay-field, .field-value-row').first().click();
          }
          await assertCorrectionsBottomSheet(page);
          await expect(page.locator('.source-chip')).toContainText('Seite 1');
          await assertNoHorizontalOverflow(page);
          if (scheme === 'light') {
            await captureViewportScreenshot(
              page,
              testInfo,
              `field-regions-bottom-sheet-${viewport.name}-${scheme}.png`
            );
          }
          await page.keyboard.press('Escape');
          await expect(sheet).toHaveCount(0);
        } else {
          await expect(page.locator('.source-chip')).toContainText('Seite 1');
          await assertNoHorizontalOverflow(page);
        }

        await setLabelsTabOpen(page, true);
        const more = page.locator('.label-chip-row-overflow-btn, .overflow-chip-more');
        await expect(more).toBeVisible({ timeout: 60_000 });
        await expect(more).toHaveText(/\+\d+/);
        await assertLongLabelChipsTruncateWithTooltip(page);
        await assertNoClippedOrOverlappingChips(page);
        await assertNoHorizontalOverflow(page);
        if (scheme === 'light') {
          await more.click();
          const popover = page.locator('.label-chip-row-overflow-popover, .overflow-chip-popover, [data-testid="label-overflow-sheet"]');
          await expect(popover).toBeVisible();
          await assertOverflowMissesHeader(page);
          await captureViewportScreenshot(
            page,
            testInfo,
            `field-regions-long-labels-${viewport.name}-${scheme}.png`
          );
          await page.keyboard.press('Escape');
          await expect(popover).toHaveCount(0);
        }
      }
    }
  });

  test('create field by text selection', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyGermanLocale(page);
    await openLayoutDocumentPage(page, layoutDocId);
    await page.getByRole('radio', { name: /Text \(T\)/i }).click();
    const word = page.locator('.pdf-page-wrap .textLayer span').first();
    await expect(word).toBeVisible({ timeout: 60_000 });
    await word.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await expect(page.getByTestId('field-context-bar')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('field-context-bar').getByRole('button', { name: /Feld anlegen|Create field/i }).click();
    await expect(page.getByText(/Korrektur gespeichert|Correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
