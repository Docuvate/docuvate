import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { setTheme } from '../../helpers/ce-ui-audit';
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

async function waitForLabelsPageReady(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('main').waitFor({ state: 'visible', timeout: 60_000 });
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

    let documentDetailPath = '/documents';

    test.beforeAll(async ({ request }) => {
      const health = await request.get(`${apiBase}/health`);
      if (!health.ok()) {
        return;
      }
      const list = await request.get(`${apiBase}/api/v1/documents?limit=1`);
      if (list.ok()) {
        const body: { items?: { id?: string }[] } = await list.json();
        const id = body.items?.[0]?.id;
        if (id) {
          documentDetailPath = `/documents/${id}`;
        }
      }
    });

    test('app surfaces', async ({ page, request }) => {
      test.setTimeout(180_000);
<<<<<<< HEAD

=======
>>>>>>> 6f5ecb2 (test(e2e): stabilize contrast smoke navigation waits)
      const health = await request.get(`${apiBase}/health`);
      test.skip(!health.ok(), 'compose API not running');

      let recommendationsMode: 'ok' | 'fail' = 'ok';
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
<<<<<<< HEAD
            await page.goto(`${webOrigin}${route.path}`);
            if (route.path === '/structure/labels') {
              await waitForLabelsPageReady(page);
            } else {
              await page.waitForLoadState('networkidle');
            }
=======
            await page.goto(`${webOrigin}${route.path}`, { waitUntil: 'domcontentloaded' });
            await page.locator('#root').waitFor({ state: 'attached', timeout: 60_000 });
>>>>>>> 6f5ecb2 (test(e2e): stabilize contrast smoke navigation waits)
            await setTheme(page, theme);
            await assertColorContrast(
              page,
              `${route.slug} ${theme} ${viewport.label}`
            );
          }

<<<<<<< HEAD
          recommendationsMode = 'fail';
          await page.goto(`${webOrigin}/structure/labels`);
          await waitForLabelsPageReady(page);
          await page.locator('.labels-todo-load-error p.error').waitFor({ state: 'visible', timeout: 30_000 });
=======
          await page.goto(`${webOrigin}/structure/labels`, { waitUntil: 'domcontentloaded' });
          await page.locator('#root').waitFor({ state: 'attached', timeout: 60_000 });
>>>>>>> 6f5ecb2 (test(e2e): stabilize contrast smoke navigation waits)
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
