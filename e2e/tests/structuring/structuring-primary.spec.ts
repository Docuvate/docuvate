// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Text and Layout are primary modes. Each one changes the document and, only
 * then, shows its tools. Mocks stand in for the API. This is not a real stack.
 */
import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { dragOnPdfPage } from '../../support/dragOnPage';
import { installStructuringMocks, LAYOUT_DOCUMENT_ID } from './structuringMocks';

const shots = '/opt/cursor/artifacts';

async function openViewer(page: Page, width: number, theme: 'light' | 'dark') {
  await page.setViewportSize({ width, height: 900 });
  const log = await installStructuringMocks(page, { theme });
  await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
  await expect(page.getByTestId('structuring-primary-ocr')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-docuvate-theme', theme);
  return log;
}

test('text and layout change the document instead of scrolling', async ({ page }) => {
  const log = await openViewer(page, 1280, 'light');
  await expect(page.getByTestId('structuring-context')).toHaveCount(0);
  await expect(page.locator('.layout-text-stage')).toHaveCount(0);

  await page.getByTestId('structuring-primary-ocr').click();
  await expect(page.getByTestId('structuring-primary-ocr')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.layout-text-stage')).toBeVisible();
  await expect(page.getByTestId('structuring-context')).toHaveAttribute('data-primary', 'text');
  await expect(page.getByTestId('structuring-edit-text')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.extracted-text-segment').first()).toBeVisible();
  await expect(page.locator('.extracted-text-reading-paragraph')).toHaveCount(0);
  await expect(page.getByTestId('structuring-save-text')).toBeDisabled();
  await expect(page.getByTestId('structuring-save-text')).toHaveAttribute('title', /.+/);
  await page.screenshot({ path: path.join(shots, 'ribbon-text-1280-light.png') });

  await page.getByTestId('structuring-primary-layout').click();
  await expect(page.getByTestId('structuring-primary-layout')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('structuring-primary-ocr')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.layout-text-stage')).toHaveCount(0);
  await expect(page.getByTestId('structuring-context')).toHaveAttribute('data-primary', 'layout');
  await expect(page.getByTestId('app-ribbon-context').getByRole('radio')).toHaveCount(3);
  await expect(page.getByTestId('structuring-overlay')).toBeVisible();
  const outline = await page.getByTestId('structuring-primary-layout').evaluate((node) => {
    return getComputedStyle(node).outlineStyle;
  });
  expect(outline).toBe('none');
  await page.screenshot({ path: path.join(shots, 'ribbon-layout-1280-light.png') });

  await page.getByTestId('structuring-primary-fields').click();
  await expect(page.getByTestId('structuring-primary-fields')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('structuring-context')).toHaveCount(0);

  await page.getByTestId('structuring-primary-labels').click();
  await expect(page.getByTestId('structuring-primary-labels')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('structuring-context')).toHaveCount(0);
  expect(log.unmatched).toEqual([]);
});

test('layout tools at 1280 dark and at a narrow width', async ({ page }) => {
  const log = await openViewer(page, 1280, 'dark');
  await page.getByTestId('structuring-primary-layout').click();
  await expect(page.locator('html')).toHaveAttribute('data-docuvate-theme', 'dark');
  await page.screenshot({ path: path.join(shots, 'ribbon-layout-1280-dark.png') });
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByTestId('app-ribbon-context').getByRole('radio')).toHaveCount(3);
  await page.screenshot({ path: path.join(shots, 'ribbon-layout-390-dark.png') });
  expect(log.unmatched).toEqual([]);
});

test('text correction edits an OCR block, saves it, and shows it after reload', async ({ page }) => {
  await openViewer(page, 1280, 'light');
  await page.getByTestId('structuring-primary-ocr').click();
  await expect(page.locator('.extracted-text-reading-paragraph')).toHaveCount(0);
  const segment = page.locator('.extracted-text-segment', { hasText: 'NORTH 1842' });
  await expect(segment).toBeVisible();
  await expect(page.locator('.extracted-text-segment', { hasText: 'INVOICE TOTAL' })).toBeVisible();
  await segment.dblclick();
  const input = page.getByRole('textbox', { name: /Block|block|Wort|word/i });
  await input.fill('NORTH 1842 korrigiert');
  await input.press('Enter');
  const save = page.getByTestId('structuring-save-text');
  await expect(save).toBeEnabled();
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes('/documents/') && response.request().method() === 'PATCH' && response.ok()
  );
  await save.click();
  await saved;
  await page.reload();
  await expect(page.getByText('NORTH 1842 korrigiert')).toBeVisible();
  await expect(page.getByText('INVOICE TOTAL')).toBeVisible();
});

function postedTableCreate(value: unknown): { x0: number; x1: number; y0: number; y1: number } | null {
  if (typeof value !== 'object' || value === null) return null;
  if (!('op' in value) || value.op !== 'create') return null;
  if (!('x0' in value) || typeof value.x0 !== 'number') return null;
  if (!('y0' in value) || typeof value.y0 !== 'number') return null;
  if (!('x1' in value) || typeof value.x1 !== 'number') return null;
  if (!('y1' in value) || typeof value.y1 !== 'number') return null;
  return { x0: value.x0, y0: value.y0, x1: value.x1, y1: value.y1 };
}

test('area drag across a saved field still offers mark as table after rotation', async ({ page }) => {
  await openViewer(page, 1280, 'light');
  await page.setViewportSize({ width: 1280, height: 720 });
  const rotate = page.getByTestId('pdf-viewer-rotate-clockwise');
  await expect(rotate).toBeVisible();
  await rotate.click();
  await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute('data-rotation-deg', '90');
  await page.getByTestId('structuring-primary-layout').click();
  await page.keyboard.press('r');
  await expect(page.getByRole('radio', { name: /Bereich|Area/ })).toBeChecked();
  await expect(page.locator('.pdf-layout-overlay-field').first()).toBeVisible();
  await dragOnPdfPage(page, 0.15, 0.55, 0.7, 0.85);
  await expect(page.getByTestId('selection-mark-table')).toBeVisible();
  const created = page.waitForResponse(
    (response) =>
      response.url().includes('/table-corrections') && response.request().method() === 'POST' && response.ok()
  );
  await page.getByTestId('selection-mark-table').click();
  const posted = postedTableCreate((await created).request().postDataJSON());
  if (!posted) throw new Error('table create body missing');
  expect(posted.x1).toBeGreaterThan(posted.x0);
  expect(posted.y1).toBeGreaterThan(posted.y0);
  await page.reload();
  const listed: unknown = await page.evaluate(async (documentId) => {
    const response = await fetch(`/api/documents/${documentId}/regions?role=table`);
    const payload: unknown = await response.json();
    return payload;
  }, LAYOUT_DOCUMENT_ID);
  const items =
    typeof listed === 'object' && listed !== null && 'items' in listed && Array.isArray(listed.items)
      ? listed.items
      : [];
  const stored = items.find((item) => {
    if (typeof item !== 'object' || item === null || !('x0' in item)) return false;
    return item.x0 === posted.x0;
  });
  expect(stored).toBeTruthy();
});
