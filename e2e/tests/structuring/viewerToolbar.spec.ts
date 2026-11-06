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
  await expect(menu.getByRole('menuitemradio', { name: 'Original' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  await expect(menu.getByRole('menuitemradio', { name: 'Erkannter Text' })).toHaveAttribute(
    'aria-checked',
    'false'
  );
  await expect(menu.getByRole('menuitem', { name: 'Im Uhrzeigersinn drehen' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  expect(log.unmatched).toEqual([]);
});
