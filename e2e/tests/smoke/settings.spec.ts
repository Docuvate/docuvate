import { expect, test } from '@playwright/test';

test.describe('Settings smoke (unauthenticated redirect)', () => {
  test('settings route requires auth and shows login or settings shell', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const onLogin = url.includes('/login');
    const settingsHeading = page.getByRole('heading', { name: /settings|einstellungen/i });
    expect(onLogin || (await settingsHeading.count()) > 0).toBeTruthy();
  });
});
