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
import { appendAuditEntry, clearAuditReport } from '../../helpers/ce-ui-audit-report';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'narrow', width: 390, height: 844 },
] as const;

function filterConsoleErrors(errors: string[]): string[] {
  return errors.filter(
    (line) =>
      !line.includes('favicon') &&
      !line.includes('Failed to load resource') &&
      !line.includes('net::ERR_')
  );
}

test.describe('CE UI audit capture', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await clearAuditReport();
  });

  test('artifact root is configured', () => {
    expect(auditArtifactRoot()).toBeTruthy();
  });

  test.describe('public auth screens', () => {
    for (const viewport of VIEWPORTS) {
      for (const locale of ['de', 'en'] as const) {
        for (const route of CE_PUBLIC_AUTH_ROUTES) {
          test(`${route.slug} (${locale}, ${viewport.label})`, async ({ page }) => {
            const health = await page.request.get(`${apiBase}/health`);
            test.skip(!health.ok(), 'compose API not running');

            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            const audit = attachPageAudit(page);
            await page.goto(`${webOrigin}${route.path}`);
            await page.waitForLoadState('networkidle');
            await setLocale(page, locale);
            await setTheme(page, 'dark');

            const bodyText = await page.locator('body').innerText();
            const rawI18nSnippets = findRawI18nSnippets(bodyText);
            const notes: string[] = [];
            if (route.path === '/login' || route.path === '/register' || route.path === '/reset-password') {
              const toggleCount = await page
                .getByRole('button', { name: /show password|passwort anzeigen/i })
                .count();
              if (toggleCount === 0) {
                notes.push('missing password visibility toggle');
              }
            }

            const dir = await ensureAuditDir(`public/${locale}/${viewport.label}`);
            const screenshot = `${dir}/${route.slug}.png`;
            await page.screenshot({ path: screenshot, fullPage: false });

            const consoleErrors = filterConsoleErrors([...audit.consoleErrors]);
            const failedRequests = [...audit.failedRequests];

            await appendAuditEntry({
              screen: route.slug,
              path: route.path,
              locale,
              theme: 'dark',
              viewport: viewport.label,
              screenshot,
              rawI18nSnippets,
              consoleErrors,
              failedRequests,
              notes,
            });

            expect(rawI18nSnippets, route.path).toEqual([]);
            expect(consoleErrors, route.path).toEqual([]);
            expect(failedRequests, route.path).toEqual([]);
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
            const audit = attachPageAudit(page);
            await page.goto(webOrigin);
            await page.waitForLoadState('networkidle');
            await setLocale(page, locale);
            await setTheme(page, theme);

            for (const route of CE_AUTHENTICATED_ROUTES) {
              audit.consoleErrors.length = 0;
              audit.failedRequests.length = 0;
              await page.goto(`${webOrigin}${route.path}`);
              await page.waitForLoadState('networkidle');

              const bodyText = await page.locator('body').innerText();
              const rawI18nSnippets = findRawI18nSnippets(bodyText);
              const notes: string[] = [];

              if (route.path === '/settings/connectors') {
                const paperless = await page.getByRole('heading', { name: /Paperless-ngx/i }).count();
                if (paperless === 0) {
                  notes.push('Paperless-ngx connector card missing');
                }
              }
              if (route.path === '/settings/account-security') {
                const toggleCount = await page
                  .getByRole('button', { name: /show password|passwort anzeigen/i })
                  .count();
                if (toggleCount === 0) {
                  notes.push('missing password visibility toggle');
                }
              }

              const dir = await ensureAuditDir(`auth/${locale}/${theme}/${viewport.label}`);
              const screenshot = `${dir}/${route.slug}.png`;
              await page.screenshot({ path: screenshot, fullPage: false });

              const consoleErrors = filterConsoleErrors([...audit.consoleErrors]);
              const failedRequests = [...audit.failedRequests];

              await appendAuditEntry({
                screen: route.slug,
                path: route.path,
                locale,
                theme,
                viewport: viewport.label,
                screenshot,
                rawI18nSnippets,
                consoleErrors,
                failedRequests,
                notes,
              });

              expect(rawI18nSnippets, route.path).toEqual([]);
              expect(consoleErrors, route.path).toEqual([]);
              expect(failedRequests, route.path).toEqual([]);
            }
          });
        }
      }
    }
  });
});
