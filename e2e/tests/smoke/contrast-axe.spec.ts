import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { setTheme } from '../../helpers/ce-ui-audit';
import {
  resolveSmokeReadyDocumentPath,
  waitForContrastPageReady,
} from '../../helpers/contrast-screenshot';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

const THEMES = ['light', 'dark'] as const;

const PUBLIC_ROUTES: { path: string; slug: string }[] = [{ path: '/login', slug: 'login' }];

const AUTHENTICATED_ROUTES: { path: string; slug: string }[] = [
  { path: '/', slug: 'dashboard' },
  { path: '/documents', slug: 'documents' },
  { path: '/settings', slug: 'settings' },
  { path: '/structure/labels', slug: 'labels' },
  { path: '/settings/connectors', slug: 'connectors' },
  { path: '/filesystem', slug: 'filesystem' },
];

async function assertColorContrast(page: import('@playwright/test').Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(
    results.violations,
    `${label}: ${results.violations.map((v) => v.id).join(', ')}`
  ).toEqual([]);
}

async function waitForAppShell(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('#root').waitFor({ state: 'attached', timeout: 60_000 });
}

test.describe('Contrast axe color-contrast', () => {
  test.describe.configure({ mode: 'serial' });

  test('public routes', async ({ page }) => {
    const health = await page.request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'compose API not running');

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const theme of THEMES) {
        for (const route of PUBLIC_ROUTES) {
          await page.goto(`${webOrigin}${route.path}`);
          await page.waitForLoadState('networkidle');
          await setTheme(page, theme);
          await assertColorContrast(
            page,
            `${route.slug} ${theme} ${viewport.label}`
          );
        }
      }
    }
  });

  test.describe('authenticated routes', () => {
    test.use({ storageState: smokeFixtureStoragePath() });

    test('app surfaces', async ({ page, request }) => {
      test.setTimeout(180_000);
      const health = await request.get(`${apiBase}/health`);
      test.skip(!health.ok(), 'compose API not running');

      const documentDetailPath = await resolveSmokeReadyDocumentPath(request, apiBase, webOrigin);

      let recommendationsMode: 'ok' | 'fail' = 'ok';
      await page.route('**/v1/labels/map**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            points: [],
            documentCount: 0,
            tagCount: 0,
            extractedDocumentCount: 0,
            emptyReason: null,
            coverageSummary: null,
          }),
        });
      });
      await page.route('**/v1/labels/document-inventory**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            documents: [],
            documentCountByTagId: {},
            inventory: { total: 0, labeled: 0, unlabeled: 0 },
          }),
        });
      });
      await page.route('**/v1/documents/review-queue/summary**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ pendingCount: 0 }),
        });
      });
      await page.route('**/v1/labels/recommendations**', async (route) => {
        if (recommendationsMode === 'fail') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'recommendations unavailable' }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [] }),
        });
      });

      const routes = [
        ...AUTHENTICATED_ROUTES,
        { path: documentDetailPath, slug: 'document-detail' },
      ];

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const theme of THEMES) {
          recommendationsMode = 'ok';
          for (const route of routes) {
            await page.goto(`${webOrigin}${route.path}`, { waitUntil: 'domcontentloaded' });
            if (route.path === '/structure/labels') {
              await waitForContrastPageReady(page, 'labels', documentDetailPath, webOrigin);
            } else {
              await waitForAppShell(page);
            }
            await setTheme(page, theme);
            await assertColorContrast(
              page,
              `${route.slug} ${theme} ${viewport.label}`
            );
          }

          recommendationsMode = 'fail';
          await page.goto(`${webOrigin}/structure/labels`, { waitUntil: 'domcontentloaded' });
          await waitForContrastPageReady(page, 'labels', documentDetailPath, webOrigin);
          await page.locator('.labels-todo-load-error p.error').waitFor({ state: 'visible', timeout: 30_000 });
          await setTheme(page, theme);
          await assertColorContrast(page, `labels-error ${theme} ${viewport.label}`);

          await page.goto(`${webOrigin}/docs/styles`);
          await page.waitForLoadState('domcontentloaded');
          const dangerItem = page.locator('.styles-menu-demo .menu-item-danger').first();
          await dangerItem.waitFor({ state: 'visible', timeout: 60_000 });
          await setTheme(page, theme);
          await assertColorContrast(page, `danger-menu ${theme} ${viewport.label}`);
        }
      }
    });
  });
});
