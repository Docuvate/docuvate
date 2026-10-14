// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('Duplicates overview', () => {
  test('loads duplicate queue page in German', async ({ page }) => {
    await page.goto('/documents/duplicates');
    await expect(page.getByRole('heading', { name: 'Duplikate' })).toBeVisible();
  });
});
