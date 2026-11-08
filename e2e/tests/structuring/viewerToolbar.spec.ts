// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Page chrome keeps rotation and the Ansicht menu. Region tools appear on the layout
 * row of the ribbon, not as a permanent bar above the page.
 */
import { expect, test } from '@playwright/test';

import { installStructuringMocks, LAYOUT_DOCUMENT_ID } from './structuringMocks';

test('viewer: marking tools follow Layout, page view stays in one menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const log = await installStructuringMocks(page);
  await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
  const toolbar = page.getByTestId('layout-viewer-toolbar');
  await expect(toolbar.getByRole('radiogroup')).toHaveCount(0);
  await page.getByTestId('structuring-primary-layout').click();
  const tools = page
    .getByTestId('app-ribbon-context')
    .getByRole('radiogroup', { name: 'Auf der Seite markieren' });
  await expect(tools.getByRole('radio')).toHaveCount(3);
  await expect(tools.getByRole('radio', { name: /^Zeiger/ })).toBeChecked();

  await tools.getByRole('radio', { name: /^Bereich/ }).click();
  await expect(page.getByTestId('structuring-context')).toContainText(/Bereich aufziehen/);
  await tools.getByRole('radio', { name: /^Text markieren/ }).click();
  await expect(page.getByTestId('structuring-context')).toContainText(/Text auf der Seite überstreichen/);

  await toolbar.getByRole('button', { name: 'Ansicht: Original' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitemradio', { name: 'Original', exact: true })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  await expect(
    menu.getByRole('menuitemradio', { name: 'Erkannter Text', exact: true })
  ).toHaveAttribute('aria-checked', 'false');
  await expect(menu.getByRole('menuitem', { name: 'Im Uhrzeigersinn drehen' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  expect(log.unmatched).toEqual([]);
});

for (const width of [390, 1024, 1280, 1440]) {
  test(`viewer: marking tools never clip their labels at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const log = await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
    await page.getByTestId('structuring-primary-layout').click();
    const toolbar = page.getByTestId('app-ribbon-context');
    await expect(toolbar.getByRole('radio')).toHaveCount(3);
    const clipped = await toolbar.evaluate((bar) => {
      const barBox = bar.getBoundingClientRect();
      const hits: string[] = [];
      for (const option of bar.querySelectorAll('[role="radio"]')) {
        const box = option.getBoundingClientRect();
        const content = option.querySelector('.segmented-option-content');
        const contentBox = content ? content.getBoundingClientRect() : box;
        if (contentBox.right > box.right + 1 || box.right > barBox.right + 1) {
          hits.push(option.textContent ?? '');
        }
      }
      return hits;
    });
    expect(clipped).toEqual([]);
    const outside = await page.evaluate(() => {
      const hits: string[] = [];
      const row = document.querySelector('[data-testid="app-ribbon-context"]');
      if (!row) return hits;
      for (const node of row.querySelectorAll('[role="radio"], button')) {
        const box = node.getBoundingClientRect();
        if (box.right > window.innerWidth + 1 || box.left < -1) {
          hits.push(node.textContent ?? '');
        }
      }
      return hits;
    });
    expect(outside).toEqual([]);
    if (width < 769) {
      const heights = await toolbar.evaluate((bar) =>
        Array.from(bar.querySelectorAll('[role="radio"], button')).map(
          (node) => node.getBoundingClientRect().height
        )
      );
      expect(heights.length).toBeGreaterThan(3);
      expect(heights.filter((height) => height < 43)).toEqual([]);
    }
    expect(log.unmatched).toEqual([]);
  });
}

test('viewer: the Ansicht menu switches to recognised text and back at 1280px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const log = await installStructuringMocks(page);
  await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
  const toolbar = page.getByTestId('layout-viewer-toolbar');
  await toolbar.getByRole('button', { name: /^(Ansicht|View):/ }).click();
  await page.getByRole('menuitemradio', { name: /^(Erkannter Text|Recognised text)$/ }).click();
  await expect(toolbar.getByRole('button', { name: 'Ansicht: Erkannter Text' })).toBeVisible();
  await toolbar.getByRole('button', { name: /^(Ansicht|View):/ }).click();
  await page.getByRole('menuitemradio', { name: /^Original$/ }).click();
  await expect(toolbar.getByRole('button', { name: 'Ansicht: Original' })).toBeVisible();
  expect(log.unmatched).toEqual([]);
});
