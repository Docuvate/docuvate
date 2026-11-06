// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import {
  openLayoutDocumentPage,
  uploadLayoutTableDocument,
} from '../../helpers/layout-document-fixture';
import { showLayoutPane } from '../../helpers/layout-pane';
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
  const word = page
    .locator('.pdf-page-wrap .textLayer span')
    .filter({
      hasText: /Widget|Alex|Testmann|FIXTURE|Compose|Brutto|Position/i,
    })
    .first();
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

async function waitForTableCorrectionSave(page: Page): Promise<void> {
  const refreshed = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname.endsWith('/regions'),
    { timeout: 30_000 }
  );
  const saved = await page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/table-corrections'),
    { timeout: 30_000 }
  );
  expect(saved.ok(), `table correction save failed status=${saved.status()}`).toBeTruthy();
  await refreshed;
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
    await expect(
      page.getByText(/Tabellenkorrektur gespeichert|Table correction saved/i)
    ).toBeVisible({
      timeout: 30_000,
    });
    const card = page.getByTestId('corrected-table-card');
    await expect(card).toBeVisible({ timeout: 30_000 });
    // Structure edits are a draft on the real table; the header stepper is directly on the card.
    const headerRows = card.getByRole('spinbutton', { name: /Kopfzeilen|Header rows/i });
    await headerRows.fill('1');
    await expect(card.getByRole('button', { name: /^(Übernehmen|Apply)$/ })).toBeVisible();
    const firstCell = card.locator('.layout-table-cell-input').first();
    await firstCell.fill('Position');
    // A pending save re-selects its table when it resolves, which would reopen the narrow sheet
    // after the viewport loop closed it; wait for the request instead of the (already shown) toast.
    await Promise.all([waitForTableCorrectionSave(page), firstCell.blur()]);
    // The mark-as-table toast may still be on screen; the newest toast belongs to the cell save.
    await expect(
      page.getByText(/Tabellenkorrektur gespeichert|Table correction saved/i).last()
    ).toBeVisible({ timeout: 30_000 });
    await assertNoHorizontalOverflow(page);

    // Table family: header band, result footer, lines and merged cells saved as one correction.
    const tools = card.first().getByTestId('table-structure-tools');
    await tools.getByRole('combobox', { name: /Vorlage|Template/i }).selectOption('financial');
    await Promise.all([
      waitForTableCorrectionSave(page),
      tools.getByRole('button', { name: /^(Übernehmen|Apply)$/ }).click(),
    ]);
    await expect(tools.getByRole('button', { name: /^(Übernehmen|Apply)$/ })).toHaveCount(0);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await expect(page.locator('.layout-workspace')).toHaveAttribute(
        'data-correction-sheet-viewport',
        viewport.width < 1024 ? '1' : '0',
        { timeout: 10_000 }
      );
      const openTableSheet = page.getByTestId('table-correction-sheet');
      if (viewport.width < 1024) {
        // The selected table reopens its correction sheet on narrow viewports; the sheet chunk
        // loads lazily, so wait for it instead of sampling the count once.
        await expect(openTableSheet).toBeVisible({ timeout: 15_000 });
        await page.keyboard.press('Escape');
        await expect(openTableSheet).toHaveCount(0);
      }
      await showLayoutPane(page, 'panel');
      await page
        .locator('.layout-side-tabs')
        .getByRole('tab', { name: /Tabellen|Tables/i })
        .click({ force: true });
      if (viewport.width < 1024) {
        const sheet = page.getByTestId('table-correction-sheet');
        // Tab change auto-selects the first table when none is selected. If selection
        // did not stick after Escape, open the sheet via the corrected-table card.
        await expect
          .poll(
            async () => {
              if (await sheet.isVisible()) {
                return 'open';
              }
              const cardHead = page.locator(
                '[data-testid="corrected-table-card"] .layout-table-card-head'
              );
              if ((await cardHead.count()) > 0 && (await cardHead.first().isVisible())) {
                await cardHead.first().click();
              }
              return (await sheet.isVisible()) ? 'open' : 'closed';
            },
            { timeout: 15_000 }
          )
          .toBe('open');
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
