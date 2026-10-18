import { expect, test } from '@playwright/test';

async function initLocale(page: import('@playwright/test').Page, locale: 'de' | 'en') {
  await page.addInitScript((loc) => {
    localStorage.setItem('docuvate-site-theme', 'light');
    localStorage.setItem('docuvate-site-locale', loc);
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  }, locale);
}

test.describe('site header nav active state', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('DE docs overview highlights only Dokumentation', async ({ page }) => {
    await initLocale(page, 'de');
    await page.goto('/docs');
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText('Dokumentation');
  });

  test('DE API page highlights only API', async ({ page }) => {
    await initLocale(page, 'de');
    await page.goto('/docs/api');
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText('API');
  });

  test('DE comparison detail highlights only Vergleiche', async ({ page }) => {
    await initLocale(page, 'de');
    await page.goto('/docs/vergleiche/papra');
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText('Vergleiche');
  });

  test('EN SDKs page highlights only SDKs', async ({ page }) => {
    await initLocale(page, 'en');
    await page.goto('/en/docs/sdks');
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText('SDKs');
  });
});
