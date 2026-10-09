import { test, expect } from '@playwright/test';
import { loginAsSmokeUser } from '../../helpers/smoke-fixture-auth';

test.describe('global chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSmokeUser(page);
  });

  test('navigation opens global chat page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Chat/i }).click();
    await expect(page.getByRole('heading', { name: /Chat/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Frage|Ask/i)).toBeVisible();
  });
});
