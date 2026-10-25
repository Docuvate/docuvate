import { expect, test } from '@playwright/test';

import {
  auditArtifactRoot,
  CE_AUTHENTICATED_ROUTES,
  CE_PUBLIC_AUTH_ROUTES,
  attachPageAudit,
  findRawI18nSnippets,
  ensureAuditDir,
  setLocale,
  setTheme,
} from '../../helpers/ce-ui-audit';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'narrow', width: 390, height: 844 },
] as const;

test.describe('CE UI audit capture', () => {
  test.beforeAll(() => {
    test.info().attach('artifact-root', {
      body: auditArtifactRoot(),
      contentType: 'text/plain',
    });
  });

  test.describe('public auth screens', () => {
    for (const viewport of VIEWPORTS) {
      for (const locale of ['de', 'en'] as const) {
        for (const route of CE_PUBLIC_AUTH_ROUTES) {
          test(`${route.slug} (${locale}, ${viewport.label})`, async ({ page }) => {
            const health = await page.request.get(`${apiBase}/health`);
            test.skip(!health.ok(), 'compose API not running');

            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            attachPageAudit(page);
            await page.goto(`${webOrigin}${route.path}`);
            await page.waitForLoadState('networkidle');
            await setLocale(page, locale);
            await setTheme(page, 'dark');

            const bodyText = await page.locator('body').innerText();
            expect(findRawI18nSnippets(bodyText)).toEqual([]);

            if (route.path === '/login' || route.path === '/register' || route.path === '/reset-password') {
              await expect(
                page.getByRole('button', { name: /show password|passwort anzeigen/i }).first()
              ).toBeVisible();
            }

            const dir = await ensureAuditDir(`public/${locale}/${viewport.label}`);
            await page.screenshot({
              path: `${dir}/${route.slug}.png`,
              fullPage: false,
            });
          });
        }
      }
    }
  });

  test.describe('authenticated shell', () => {
    test.use({ storageState: smokeFixtureStoragePath() });

    for (const viewport of VIEWPORTS) {
      for (const locale of ['de', 'en'] as const) {
        for (const theme of ['light', 'dark'] as const) {
          test(`routes (${locale}, ${theme}, ${viewport.label})`, async ({ page }) => {
            const health = await page.request.get(`${apiBase}/health`);
            test.skip(!health.ok(), 'compose API not running');

            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            attachPageAudit(page);
            await page.goto(webOrigin);
            await page.waitForLoadState('networkidle');
            await setLocale(page, locale);
            await setTheme(page, theme);

            for (const route of CE_AUTHENTICATED_ROUTES) {
              await page.goto(`${webOrigin}${route.path}`);
              await page.waitForLoadState('networkidle');
              const bodyText = await page.locator('body').innerText();
              expect(findRawI18nSnippets(bodyText), route.path).toEqual([]);

              if (route.path === '/settings/connectors') {
                await expect(page.getByRole('heading', { name: /Paperless-ngx/i })).toBeVisible();
              }
              if (route.path === '/settings/account-security') {
                await expect(
                  page.getByRole('button', { name: /show password|passwort anzeigen/i }).first()
                ).toBeVisible();
              }

              const dir = await ensureAuditDir(`auth/${locale}/${theme}/${viewport.label}`);
              await page.screenshot({
                path: `${dir}/${route.slug}.png`,
                fullPage: false,
              });
            }
          });
        }
      }
    }
  });
});
