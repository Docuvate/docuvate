import { expect, test } from '@playwright/test';

test.describe('Login smoke', () => {
  test('login page renders in German or English without raw i18n keys', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/\bauth\.[a-zA-Z0-9_.-]+\b/);
    expect(body).not.toMatch(/\bcommon\.[a-zA-Z0-9_.-]+\b/);
  });
});
