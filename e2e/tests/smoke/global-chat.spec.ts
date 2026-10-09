import { expect, test } from '@playwright/test';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('global chat', () => {
  test('navigation opens global chat page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Chat/i }).click();
    await expect(page.getByRole('heading', { name: /Chat/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Frage|Ask/i)).toBeVisible();
  });
});
