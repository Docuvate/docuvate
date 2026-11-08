// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Text and Layout are primary modes. Each one changes the document and, only
 * then, shows its tools. Mocks stand in for the API. This is not a real stack.
 */
import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

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
