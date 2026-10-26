// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { assertNoHorizontalOverflow, captureLoadedScreenshot } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

async function drawRectangle(page: Page): Promise<void> {
  const canvas = page.locator('.pdf-page-canvas').first();
  await expect(canvas).toBeVisible({ timeout: 180_000 });
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + 40, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 320, box.y + 220);
  await page.mouse.up();
}

test.describe('document table regions', () => {
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  let layoutDocId: string;

  test.beforeAll(async ({ request }) => {
    layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
  });

  test.afterAll(async ({ request }) => {
    if (!layoutDocId) {
      return;
    }
    await request.delete(`${apiBase}/v1/documents/${layoutDocId}`, {
      headers: { origin: webOrigin },
    });
  });

  test('mark region as table, set header rows, edit a cell', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLayoutDocumentPage(page, layoutDocId);
    await page.getByRole('radio', { name: /Rechteck|Rectangle/i }).click();
    await drawRectangle(page);
    const bar = page.getByTestId('field-context-bar');
    await expect(bar).toBeVisible({ timeout: 30_000 });
    await bar.getByRole('button', { name: /Als Tabelle markieren|Mark as table/i }).click();
    await expect(page.getByText(/Tabellenkorrektur gespeichert|Table correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
    const card = page.getByTestId('corrected-table-card');
    await expect(card).toBeVisible({ timeout: 30_000 });
    const headerRows = card.getByLabel(/Kopfzeilen|Header rows/i);
    await headerRows.fill('1');
    await headerRows.blur();
    const firstCell = card.locator('.layout-table-cell-input').first();
    await firstCell.fill('Position');
    await firstCell.blur();
    await expect(page.getByText(/Tabellenkorrektur gespeichert|Table correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
    await assertNoHorizontalOverflow(page);
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'table-regions-1440-light.png'
    );
  });

  test('corrected table is overflow-safe at 390', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLayoutDocumentPage(page, layoutDocId);
    await page.getByRole('tab', { name: /Tables|Tabellen/i }).click();
    await expect(page.getByTestId('corrected-table-card')).toBeVisible({ timeout: 60_000 });
    await assertNoHorizontalOverflow(page);
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'table-regions-390-light.png'
    );
  });
});
