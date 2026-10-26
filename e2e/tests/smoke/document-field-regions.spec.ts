// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { assignLongLabels, longLabelNames } from '../../helpers/long-label-fixture';
import { assertNoHorizontalOverflow, captureLoadedScreenshot } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '390', width: 390, height: 844 },
] as const;

async function drawRectangle(page: Page): Promise<void> {
  const canvas = page.locator('.pdf-page-canvas').first();
  await expect(canvas).toBeVisible({ timeout: 180_000 });
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + 48, box.y + 48);
  await page.mouse.down();
  await page.mouse.move(box.x + 220, box.y + 110);
  await page.mouse.up();
}

test.describe('document field regions', () => {
  test.describe.configure({ mode: 'serial' });

  let layoutDocId: string;
  const labels = longLabelNames(25);

  test.beforeAll(async ({ request }) => {
    layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
    await assignLongLabels(request, apiBase, webOrigin, layoutDocId, labels);
  });

  for (const viewport of VIEWPORTS) {
    for (const scheme of ['light', 'dark'] as const) {
      test(`no overflow at ${viewport.name} ${scheme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme: scheme });
        await openLayoutDocumentPage(page, layoutDocId);
        if (viewport.name === '390' && scheme === 'light') {
          await expect(page.locator('.layout-side-panel')).toBeVisible({ timeout: 60_000 });
          await captureLoadedScreenshot(
            page.locator('.document-detail-page'),
            testInfo,
            `field-regions-bottom-sheet-${viewport.name}-${scheme}.png`
          );
        }
        await page.getByRole('tab', { name: /Labels|Label/i }).click();
        await expect(page.locator('.overflow-chip-more')).toBeVisible({ timeout: 60_000 });
        await assertNoHorizontalOverflow(page);
        if (
          (viewport.name === '1440' || viewport.name === '390') &&
          scheme === 'light'
        ) {
          await captureLoadedScreenshot(
            page.locator('.document-detail-page'),
            testInfo,
            `field-regions-long-labels-${viewport.name}-${scheme}.png`
          );
        }
      });
    }
  }

  test('create field by rectangle, correct, and undo', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLayoutDocumentPage(page, layoutDocId);
    await page.getByRole('radio', { name: /Rechteck|Rectangle/i }).click();
    await drawRectangle(page);
    const bar = page.getByTestId('field-context-bar');
    await expect(bar).toBeVisible({ timeout: 30_000 });
    await bar.getByRole('button', { name: /Feld anlegen|Create field/i }).click();
    await expect(page.getByText(/Korrektur gespeichert|Correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-after-rectangle.png'
    );
    await page.getByRole('button', { name: /Rückgängig|Undo/i }).click();
    await expect(page.getByTestId('field-context-bar')).toHaveCount(0);
  });

  test('create field by text selection', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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
