// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Locator } from '@playwright/test';

/** The template control is a menu of schematics, not a native combobox. */
export async function chooseTableFamily(tools: Locator, name: RegExp): Promise<void> {
  const page = tools.page();
  await tools.getByRole('button', { name: 'Vorlage' }).click();
  const option = page.getByRole('option', { name });
  await option.click();
  await expect(option).toBeHidden();
}
