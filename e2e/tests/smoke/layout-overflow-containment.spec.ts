import { expect, request as playwrightRequest, test } from '@playwright/test';

import { collectUnhandledHorizontalOverflowInPage } from '../helpers/browser-layout-scans';
import {
  collectBreadcrumbTextOverflowViolations,
  collectFilesystemTreeLabelViolations,
} from '../helpers/filesystem-layout-scans';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { ensureWorkstreamEFilesystemTree } from '../../helpers/workstream-e-filesystem-fixture';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '1024', width: 1024, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

async function requireApi(page: import('@playwright/test').Page): Promise<void> {
  const health = await page.request.get(`${apiBase}/health`);
  test.skip(!health.ok(), 'compose API not running');
}

test.describe('Layout overflow containment', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let workstreamBrowseFolderId: string | null = null;

  test.beforeAll(async () => {
    const probe = await playwrightRequest.newContext();
    let healthOk = false;
    try {
      const healthRes = await probe.get(`${apiBase}/health`);
      healthOk = healthRes.ok();
    } finally {
      await probe.dispose();
    }
    if (!healthOk) {
      return;
    }

    const authed = await playwrightRequest.newContext({
      storageState: smokeFixtureStoragePath(),
    });
    try {
      const filesystem = await ensureWorkstreamEFilesystemTree(authed, apiBase, webOrigin);
      workstreamBrowseFolderId = filesystem.browseFolderId;
    } finally {
      await authed.dispose();
    }
  });

  for (const viewport of VIEWPORTS) {
    test(`filesystem folder view (${viewport.label}px)`, async ({ page }) => {
      await requireApi(page);
      expect(workstreamBrowseFolderId, 'workstream E filesystem fixture').toBeTruthy();
      if (!workstreamBrowseFolderId) {
        return;
      }
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/filesystem/folders/${workstreamBrowseFolderId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 90_000 });
      await page.locator('.dateisystem-breadcrumb').waitFor({ state: 'visible', timeout: 90_000 });

      const header = page.locator('.dateisystem-content-header');
      const overflowViolations = await header.evaluate(collectUnhandledHorizontalOverflowInPage);
      expect(overflowViolations, JSON.stringify(overflowViolations, null, 2)).toEqual([]);

      const breadcrumbViolations = await header.evaluate(collectBreadcrumbTextOverflowViolations);
      expect(breadcrumbViolations, JSON.stringify(breadcrumbViolations, null, 2)).toEqual([]);

      const treeViolations = await page
        .locator('.dateisystem-sidebar')
        .evaluate(collectFilesystemTreeLabelViolations);
      expect(treeViolations, JSON.stringify(treeViolations, null, 2)).toEqual([]);
    });

    test(`documents list (${viewport.label}px)`, async ({ page }) => {
      await requireApi(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/documents`, { waitUntil: 'domcontentloaded' });
      const toolbar = page.locator('.library-list-toolbar');
      await toolbar.waitFor({ state: 'visible', timeout: 90_000 });
      await page
        .locator('.library-table-virtual-body, .library-empty-state, .library-doc-stack-list')
        .first()
        .waitFor({
          state: 'visible',
          timeout: 90_000,
        });

      const violations = await toolbar.evaluate(collectUnhandledHorizontalOverflowInPage);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});
