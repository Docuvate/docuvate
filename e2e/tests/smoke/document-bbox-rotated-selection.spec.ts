// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import {
  openRotatedDocumentPage,
  uploadRotatedLayoutDocument,
} from '../../helpers/rotated-document-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 },
] as const;

async function applyGermanLocale(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/');
  await applyDocuvateLocale(page, 'de');
}

async function dragRectangleFraction(
  page: Page,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Promise<void> {
  const canvas = page.locator('.pdf-page-canvas').first();
  await expect(canvas).toBeVisible({ timeout: 180_000 });
  // On phones the review workbench sits above the document; bring the page into view first.
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width * x0, box.y + box.height * y0);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * x1, box.y + box.height * y1, { steps: 8 });
  await page.mouse.up();
}

test.describe('rotated page bounding-box selection', () => {
  let docId = '';
  let owned = false;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(300_000);
    docId = await uploadRotatedLayoutDocument(request, apiBase, webOrigin);
    owned = true;
  });

  test.afterAll(async ({ request }) => {
    if (!owned || !docId) {
      return;
    }
    await request.delete(`${apiBase}/v1/documents/${docId}`, {
      headers: { origin: webOrigin },
    });
  });

  for (const viewport of VIEWPORTS) {
    test(`rectangle selection finds fixture words (${viewport.name})`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await applyGermanLocale(page);
      await openRotatedDocumentPage(page, docId);

      await expect(page.getByTestId('document-selection-layer')).toHaveAttribute(
        'data-token-count',
        /^(?!0$)\d+$/,
        { timeout: 60_000 }
      );

      await page
        .getByTestId('document-selection-tools')
        .getByRole('radio', { name: /^(Bereich|Area)/ })
        .click();
      await dragRectangleFraction(page, 0.05, 0.05, 0.95, 0.95);

      const bar = page.getByTestId('field-context-bar');
      await expect(bar).toBeVisible({ timeout: 30_000 });
      await expect(bar).toContainText(/Alex|Testmann|E2E_SYNTHETIC|Compose|fixture/i);
      const wordCount = bar.locator('.document-field-context-bar-meta');
      await expect(wordCount).not.toContainText(/0 Wörter|0 words/i);
    });
  }

  test('text tool selection resolves words on the rotated page', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyGermanLocale(page);
    await openRotatedDocumentPage(page, docId);

    await expect(page.getByTestId('document-selection-layer')).toHaveAttribute(
      'data-token-count',
      /^(?!0$)\d+$/,
      { timeout: 60_000 }
    );

    await page
      .getByTestId('document-selection-tools')
      .getByRole('radio', { name: /^(Text markieren|Mark text)/ })
      .click();
    // Prefer a clean name span — the SYNTHETIC_FIXTURE line OCRs into fragments on /Rotate.
    const word = page
      .locator('.pdf-page-wrap .textLayer span')
      .filter({ hasText: /Alex|Testmann/i })
      .first();
    await expect(word).toBeVisible({ timeout: 60_000 });
    await word.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    const bar = page.getByTestId('field-context-bar');
    await expect(bar).toBeVisible({ timeout: 30_000 });
    await expect(bar).toContainText(/Alex|Testmann/i, { timeout: 30_000 });
    await expect(bar).not.toContainText(/0 Wörter|0 words/i);
  });
});
