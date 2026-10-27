// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import {
  assertNoHorizontalOverflow,
  assertTableCorrectionSheet,
  assertToastMissesSheetActions,
  captureViewportScreenshot,
} from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { findReadyLayoutDocument } from '../../helpers/wait-for-layout-ir';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

const VIEWPORTS = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
] as const;

async function applyGermanLocale(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/');
  await applyDocuvateLocale(page, 'de');
}

async function drawTableRectangle(page: Page): Promise<void> {
  const word = page.locator('.pdf-page-wrap .textLayer span').filter({
    hasText: /Widget|Alex|Testmann|FIXTURE|Compose|Brutto|Position/i,
  }).first();
  if ((await word.count()) > 0) {
    await expect(word).toBeVisible({ timeout: 60_000 });
    const box = await word.boundingBox();
    expect(box).toBeTruthy();
    if (!box) {
      return;
    }
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 160, box.y + box.height + 48);
    await page.mouse.up();
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
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.28);
  await page.mouse.up();
}

test.describe('document table regions', () => {
  test.describe.configure({ mode: 'serial', timeout: 420_000, retries: 0 });

  let layoutDocId: string;
  let ownedLayoutDoc = false;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(420_000);
    const existing = await findReadyLayoutDocument(request, apiBase, webOrigin);
    if (existing) {
      layoutDocId = existing;
    } else {
      layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
      ownedLayoutDoc = true;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!layoutDocId || !ownedLayoutDoc) {
      return;
    }
    await request.delete(`${apiBase}/v1/documents/${layoutDocId}`, {
      headers: { origin: webOrigin },
    });
  });

  test('mark region as table, set headers, edit a cell at every required width', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyGermanLocale(page);
    await openLayoutDocumentPage(page, layoutDocId);
    await expect(page.getByTestId('document-selection-layer')).toHaveAttribute(
      'data-token-count',
      /^(?!0$)\d+$/,
      { timeout: 60_000 }
    );
    await page.getByRole('radio', { name: /Rechteck|Rectangle/i }).click();
    await drawTableRectangle(page);
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

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await expect(page.locator('.layout-workspace')).toHaveAttribute(
        'data-correction-sheet-viewport',
        viewport.width < 1024 ? '1' : '0',
        { timeout: 10_000 }
      );
      await page
        .locator('.layout-side-tabs')
        .getByRole('tab', { name: /Tabellen|Tables/i })
        .click({ force: true });
      if (viewport.width < 1024) {
        await expect(page.getByTestId('table-correction-sheet')).toBeVisible({ timeout: 15_000 });
      } else {
        await expect(page.getByTestId('corrected-table-card')).toBeVisible({ timeout: 15_000 });
      }
      await captureViewportScreenshot(page, testInfo, `table-regions-${viewport.name}-light.png`);
      if (viewport.width < 1024) {
        await assertTableCorrectionSheet(page);
        await assertToastMissesSheetActions(
          page,
          '[data-testid="table-correction-sheet"] .layout-table-header-controls'
        );
      } else {
        await expect(page.locator('[data-testid="table-correction-sheet"]')).toHaveCount(0);
      }
      await assertNoHorizontalOverflow(page);
    }
  });
});
