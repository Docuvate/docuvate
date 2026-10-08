import { test, expect } from '@playwright/test';
import { globalSearchStoragePath } from '../../helpers/global-search-creds.js';

test.use({ storageState: globalSearchStoragePath() });

test.describe('Global search highlights', () => {
  test('marks Nordwind in document title for Nordwind query', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'networkidle' });

    await page.keyboard.press('Control+K');
    await page.waitForSelector('.global-search-palette-input');
    await page.locator('.global-search-palette-input').fill('Nordwind');
    await page.waitForTimeout(500);
    const titleMark = page.locator('.global-search-result-title .global-search-mark').first();
    await expect(titleMark).toBeVisible();
    await expect(titleMark).toHaveText('Nordwind');
  });

  test('Rehcnung returns Rechnung hits without did-you-mean UI', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'networkidle' });

    await page.keyboard.press('Control+K');
    await page.waitForSelector('.global-search-palette-input');
    await page.locator('.global-search-palette-input').fill('Rehcnung');
    await page.waitForTimeout(600);
    await expect(page.locator('.global-search-did-you-mean, .global-search-did-you-mean-btn')).toHaveCount(0);
    await expect(page.locator('.global-search-no-results')).toHaveCount(0);
    await expect(page.locator('.global-search-result-title')).toContainText(/Rechnung/i);
  });
});
