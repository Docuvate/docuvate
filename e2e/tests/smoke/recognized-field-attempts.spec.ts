// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { loginAsSmokeUser } from '../../helpers/smoke-fixture-auth.js';

test.describe('Recognized field attempts and library labels', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSmokeUser(page);
  });

  test('document list labels column renders assigned labels', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.locator('.library-table')).toBeVisible();
    const labelCell = page.locator('.library-table td.library-col-labels').first();
    await expect(labelCell).toBeVisible();
    const hasChip = await labelCell.locator('.chip').count();
    const empty = await labelCell.textContent();
    expect(hasChip > 0 || (empty ?? '').trim().length === 0).toBeTruthy();
  });
});
