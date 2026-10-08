import { expect, test } from '@playwright/test';
import { globalSearchStoragePath } from '../../helpers/global-search-creds.js';

test.use({ storageState: globalSearchStoragePath() });

test.describe('Global search palette', () => {
  async function openPalette(page: import('@playwright/test').Page) {
    await page.goto('/documents', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+K');
    await page.waitForSelector('.global-search-palette-input');
  }

  test('typo queries rank expected documents in top results', async ({ page }) => {
    await openPalette(page);

    for (const [query, needle] of [
      ['Rehcnung', 'Rechnung'],
      ['Kontoauszg', 'Kontoauszug'],
      ['Nordwnd', 'Nordwind'],
    ] as const) {
      await page.locator('.global-search-palette-input').fill('');
      await page.locator('.global-search-palette-input').fill(query);
      await page.waitForTimeout(500);
      await expect(page.locator('.global-search-did-you-mean, .global-search-did-you-mean-btn')).toHaveCount(0);
      await expect(page.locator('.global-search-result-title').first()).toContainText(new RegExp(needle, 'i'));
    }
  });

  test('gibberish shows empty state', async ({ page }) => {
    await openPalette(page);
    await page.locator('.global-search-palette-input').fill('zzqqnoexist');
    await page.waitForTimeout(400);
    await expect(page.locator('.global-search-no-results')).toBeVisible();
  });

  test('keyboard navigation selects a row', async ({ page }) => {
    await openPalette(page);
    await page.locator('.global-search-palette-input').fill('rechnung');
    await page.waitForTimeout(400);
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.global-search-option.active')).toHaveCount(1);
  });
});
