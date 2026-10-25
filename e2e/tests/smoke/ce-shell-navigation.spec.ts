import { expect, test, type Page } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

const RAW_KEY = /\b(connectors|settings|documents|auth|common)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;

const AUTHENTICATED_PATHS = [
  '/',
  '/documents',
  '/chat',
  '/structure/labels',
  '/structure/recognized-fields',
  '/filesystem',
  '/settings',
  '/settings/connectors',
  '/settings/blocked-labels',
  '/settings/account-security',
  '/settings/admin',
  '/review',
];

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

async function setLocale(page: Page, locale: 'de' | 'en') {
  const group = page.locator('.locale-switcher-wrap--topbar .segmented-control');
  if ((await group.count()) === 0) {
    return;
  }
  const label = locale === 'de' ? /DE/i : /EN/i;
  await group.getByRole('radio', { name: label }).click();
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((next) => {
    document.documentElement.dataset.docuvateTheme = next;
  }, theme);
}

test.describe('CE shell navigation', () => {
  test.describe('public auth screens', () => {
    for (const path of PUBLIC_PATHS) {
      test(`renders ${path} without raw i18n keys`, async ({ page }) => {
        const health = await page.request.get(`${apiBase}/health`);
        test.skip(!health.ok(), 'compose API not running');

        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${webOrigin}${path}`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).not.toContainText(RAW_KEY);
      });
    }
  });

  test.describe('authenticated app shell', () => {
    test.use({ storageState: smokeFixtureStoragePath() });

    for (const locale of ['de', 'en'] as const) {
      for (const theme of ['light', 'dark'] as const) {
        test(`core routes (${locale}, ${theme})`, async ({ page }) => {
          const health = await page.request.get(`${apiBase}/health`);
          test.skip(!health.ok(), 'compose API not running');

          await page.setViewportSize({ width: locale === 'de' ? 1280 : 390, height: 900 });
          await page.goto(webOrigin);
          await page.waitForLoadState('networkidle');
          await setLocale(page, locale);
          await setTheme(page, theme);

          for (const path of AUTHENTICATED_PATHS) {
            await page.goto(`${webOrigin}${path}`);
            await page.waitForLoadState('networkidle');
            await expect(page.locator('body')).not.toContainText(RAW_KEY);
          }
        });
      }
    }
  });
});
