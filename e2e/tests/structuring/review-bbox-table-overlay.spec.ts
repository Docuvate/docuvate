// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { LAYOUT_DOCUMENT_ID, installStructuringMocks } from './structuringMocks';

const shotDir = path.join(__dirname, '..', '..', 'test-results', 'review-bbox-shots');

test.describe('review queue, field bbox and table overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('review queue opens structuring instead of a competing wizard', async ({ page }) => {
    await installStructuringMocks(page);
    await page.goto('/review');
    await expect(page.getByTestId('review-next-work')).toBeVisible();
    await expect(page.getByTestId('review-open-structuring')).toBeVisible();
    await expect(page.locator('.review-wizard')).toHaveCount(0);
    await page.getByTestId('review-open-structuring').click();
    await expect(page).toHaveURL(/\/documents\/.+\?review=1/);
  });

  test('correcting a value can open field bounding-box handles', async ({ page }) => {
    await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}?review=1`);
    await page.getByRole('button', { name: /Betrag korrigieren|Correct amount|total_amount/i }).click();
    const position = page.getByTestId('field-position-correct');
    await expect(position).toBeVisible();
    await position.click();
    await expect(page.getByTestId('field-bbox-editor')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.field-bbox-handle')).toHaveCount(8);
  });

  test('table family menu shows schematics and document overlay opens, selects, resizes, closes', async ({
    page,
  }) => {
    await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
    await page.getByRole('tab', { name: /Layout|Tables|Tabellen/i }).first().click();
    const family = page.getByTestId('table-family-menu');
    await expect(family).toBeVisible({ timeout: 30_000 });
    await family.click();
    await expect(page.locator('.table-family-menu-scroll .table-family-thumb')).toHaveCount(6);
    await expect(page.getByRole('option', { name: /Einfache Tabelle|Simple table/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /Finanzlayout|Financial/i })).toBeVisible();
    await expect(page.locator('.table-family-menu-scroll .table-family-hint').first()).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByTestId('table-edit-in-document').click();
    const overlay = page.getByTestId('table-pdf-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('.table-pdf-guide-row, .table-pdf-guide-col').first()).toBeVisible();

    await page.locator('.table-pdf-cell').first().click();
    await expect(page.locator('.table-pdf-cell-selected')).toHaveCount(1);

    const box = page.locator('.table-pdf-overlay-box');
    const before = await box.boundingBox();
    expect(before).toBeTruthy();
    const handle = page.getByTestId('table-bounds-handle');
    const handleBox = await handle.boundingBox();
    expect(handleBox).toBeTruthy();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + 36, handleBox!.y + 28);
    await page.mouse.up();
    const after = await box.boundingBox();
    expect(after).toBeTruthy();
    expect((after!.width + after!.height)).toBeGreaterThan((before!.width + before!.height) - 1);

    await page.getByTestId('table-overlay-save-bounds').click();
    // Layout chrome still intact — no detached redrawn table takeover.
    await expect(page.getByTestId('layout-viewer-stage')).toBeVisible();
    await expect(page.getByTestId('corrected-table-card').or(page.locator('.layout-table-card')).first()).toBeVisible();

    await page.getByTestId('table-edit-in-document').click();
    await expect(page.getByTestId('table-pdf-overlay')).toBeVisible();
    await page.getByTestId('table-overlay-close').click();
    await expect(page.getByTestId('table-pdf-overlay')).toHaveCount(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`screenshot family menu + overlay · ${theme}`, async ({ page }) => {
      await installStructuringMocks(page, { theme });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
      await page.getByRole('tab', { name: /Layout|Tables|Tabellen/i }).first().click();
      const family = page.getByTestId('table-family-menu');
      await expect(family).toBeVisible({ timeout: 30_000 });
      await family.click();
      await expect(page.locator('.table-family-menu-scroll .table-family-thumb')).toHaveCount(6);
      await page.screenshot({
        path: path.join(shotDir, `table-family-menu-${theme}.png`),
        fullPage: false,
      });
      await page.keyboard.press('Escape');
      await page.getByTestId('table-edit-in-document').click();
      await expect(page.getByTestId('table-pdf-overlay')).toBeVisible();
      await page.screenshot({
        path: path.join(shotDir, `table-pdf-overlay-${theme}.png`),
        fullPage: false,
      });
    });
  }

  test('screenshot sideways page rotation with table overlay', async ({ page }) => {
    await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
    await page.getByRole('tab', { name: /Layout|Tables|Tabellen/i }).first().click();
    const rotate = page.getByTestId('pdf-viewer-rotate-clockwise');
    await expect(rotate).toBeVisible({ timeout: 30_000 });
    await rotate.click();
    await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute(
      'data-rotation-deg',
      '90'
    );
    await page.getByTestId('table-edit-in-document').click();
    await expect(page.getByTestId('table-pdf-overlay')).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, 'table-pdf-overlay-rotated-90.png'),
      fullPage: false,
    });
  });

  test('manual page transform persists via API and GET returns it', async ({ page }) => {
    const log = await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
    const rotate = page.getByTestId('pdf-viewer-rotate-clockwise');
    await expect(rotate).toBeVisible({ timeout: 30_000 });
    await rotate.click();
    await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute(
      'data-rotation-deg',
      '90'
    );
    // Mock recorded the POST; GET must now return the stored transform.
    const transforms = await page.evaluate(async (docId) => {
      const res = await fetch(`/api/v1/documents/${docId}/page-transforms`);
      return res.json();
    }, LAYOUT_DOCUMENT_ID);
    expect(transforms.transforms?.length ?? 0).toBeGreaterThan(0);
    expect(transforms.transforms[0].rotationQuarterTurns).toBe(1);
    expect(log.calls.some((c) => c.includes('POST') && c.includes('/transform'))).toBeTruthy();
  });

  test('field bbox save posts reanchor with MediaBox coordinates', async ({ page }) => {
    const log = await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}?review=1`);
    await page.getByRole('button', { name: /Betrag korrigieren|Correct amount|total_amount/i }).click();
    await page.getByTestId('field-position-correct').click();
    const editor = page.getByTestId('field-bbox-editor');
    await expect(editor).toBeVisible({ timeout: 15_000 });
    const box = page.locator('.field-bbox-box');
    const handle = page.locator('.field-bbox-handle--se');
    const before = await box.boundingBox();
    const hb = await handle.boundingBox();
    expect(before && hb).toBeTruthy();
    await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb!.x + 40, hb!.y + 24);
    await page.mouse.up();
    await page.getByTestId('field-bbox-save').click();
    await expect
      .poll(() => log.fieldCorrections.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    const body = log.fieldCorrections[0] as {
      op?: string;
      fieldKey?: string;
      x0?: number;
      y0?: number;
      x1?: number;
      y1?: number;
      page?: number;
    };
    expect(body.op).toBe('reanchor');
    expect(body.fieldKey).toBe('total_amount');
    expect(body.page).toBe(1);
    expect(body.x0).toBeGreaterThanOrEqual(0);
    expect(body.y0).toBeGreaterThanOrEqual(0);
    expect(body.x1).toBeGreaterThan(body.x0!);
    expect(body.y1).toBeGreaterThan(body.y0!);
  });

  test('screenshot field bbox on rotated page', async ({ page }) => {
    await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}?review=1`);
    const rotate = page.getByTestId('pdf-viewer-rotate-clockwise');
    await expect(rotate).toBeVisible({ timeout: 30_000 });
    await rotate.click();
    await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute(
      'data-rotation-deg',
      '90'
    );
    await page.getByRole('button', { name: /Betrag korrigieren|Correct amount|total_amount/i }).click();
    await page.getByTestId('field-position-correct').click();
    await expect(page.getByTestId('field-bbox-editor')).toBeVisible({ timeout: 15_000 });
    await page.screenshot({
      path: path.join(shotDir, 'field-bbox-rotated-90.png'),
      fullPage: false,
    });
  });

});
