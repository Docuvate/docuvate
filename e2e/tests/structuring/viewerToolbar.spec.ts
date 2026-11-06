// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * The viewer leads with the structuring task: how a click on the page behaves, with a hint that
 * says what happens next. How the page is shown sits in one "Ansicht" menu.
 */
import { expect, test } from '@playwright/test';

import { installStructuringMocks, LAYOUT_DOCUMENT_ID } from './structuringMocks';

test('viewer: marking tools first, page view in one menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const log = await installStructuringMocks(page);
  await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
  const toolbar = page.getByTestId('layout-viewer-toolbar');
  const tools = toolbar.getByRole('radiogroup', { name: 'Auf der Seite markieren' });
  await expect(tools.getByRole('radio')).toHaveCount(3);
  await expect(tools.getByRole('radio', { name: /^Zeiger/ })).toBeChecked();
  // Only one radio group in the bar: original/text is no longer a competing mode switch.
  await expect(toolbar.getByRole('radiogroup')).toHaveCount(1);

  await tools.getByRole('radio', { name: /^Bereich/ }).click();
  await expect(toolbar.getByText(/Bereich aufziehen/)).toBeVisible();
  await tools.getByRole('radio', { name: /^Text markieren/ }).click();
  await expect(toolbar.getByText(/Text auf der Seite überstreichen/)).toBeVisible();

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
    const toolbar = page.getByTestId('layout-viewer-toolbar');
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
    if (width < 769) {
      // Touch: every control in the bar is at least 44px tall.
      const heights = await toolbar.evaluate((bar) =>
        Array.from(bar.querySelectorAll('[role="radio"], button[aria-haspopup]')).map(
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
