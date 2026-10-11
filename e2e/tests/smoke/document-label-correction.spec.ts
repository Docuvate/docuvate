import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('document label one-click correction', () => {
  test('undo bar appears after NEST confirm when suggestions exist', async ({ page }) => {
    await page.goto('/documents');
    const firstDoc = page.locator('.library-doc-table-card a').first();
    await expect(firstDoc).toBeVisible({ timeout: 90_000 });
    await firstDoc.click();
    await page.getByRole('tab', { name: /labels/i }).click();
    const nest = page.locator('[data-ux="label-nest-correction"]');
    if (await nest.count() === 0) {
      test.skip(true, 'No NEST suggestions on fixture document');
    }
    await nest.getByRole('button', { name: /confirm label|label bestätigen/i }).click();
    await expect(page.locator('.label-correction-undo')).toBeVisible({ timeout: 15_000 });
    await page.locator('.label-correction-undo').getByRole('button', { name: /undo|rückgängig/i }).click();
    await expect(page.locator('.label-correction-undo')).toBeHidden();
  });
});
