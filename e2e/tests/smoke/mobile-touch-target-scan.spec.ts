import { expect, request as playwrightRequest, test } from '@playwright/test';

import { parseDocumentListBody } from '../../helpers/json-body';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { collectUndersizedTouchTargetsInPage } from '../helpers/browser-layout-scans';
import { ensureWorkstreamEFilesystemTree } from '../../helpers/workstream-e-filesystem-fixture';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.use({ storageState: smokeFixtureStoragePath() });

async function requireApi(page: import('@playwright/test').Page): Promise<void> {
  const health = await page.request.get(`${apiBase}/health`);
  test.skip(!health.ok(), 'compose API not running');
}

async function assertTouchTargets(page: import('@playwright/test').Page, rootSelector: string): Promise<void> {
  const root = page.locator(rootSelector);
  await root.waitFor({ state: 'visible', timeout: 90_000 });
  const violations = await root.evaluate(collectUndersizedTouchTargetsInPage);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test.describe('Mobile touch targets (390px)', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let workstreamBrowseFolderId: string | null = null;
  let pdfDocumentId: string | null = null;

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
      const listRes = await authed.get(`${apiBase}/v1/documents?limit=32`, {
        headers: { origin: webOrigin },
      });
      if (listRes.ok()) {
        const pdf = parseDocumentListBody(await listRes.json()).find(
          (item) => item.mimeType === 'application/pdf'
        );
        pdfDocumentId = pdf?.id ?? null;
      }
    } finally {
      await authed.dispose();
    }
  });

  test('documents list', async ({ page }) => {
    await requireApi(page);
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${webOrigin}/documents`, { waitUntil: 'domcontentloaded' });
    await page.locator('.library-table-virtual-body, .library-empty-state, .library-doc-stack-list').first().waitFor({
      state: 'visible',
      timeout: 90_000,
    });
    await assertTouchTargets(page, '.library-page');
  });

  test('filesystem folder view', async ({ page }) => {
    await requireApi(page);
    expect(workstreamBrowseFolderId).toBeTruthy();
    if (!workstreamBrowseFolderId) {
      return;
    }
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${webOrigin}/filesystem/folders/${workstreamBrowseFolderId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 90_000 });
    await page.locator('.dateisystem-breadcrumb').waitFor({ state: 'visible', timeout: 90_000 });
    await assertTouchTargets(page, '.dateisystem-content-header');
    await assertTouchTargets(page, '.dateisystem-sidebar');
  });

  test('document detail', async ({ page }) => {
    await requireApi(page);
    expect(pdfDocumentId).toBeTruthy();
    if (!pdfDocumentId) {
      return;
    }
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${webOrigin}/documents/${pdfDocumentId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.document-detail-page, .pdf-viewer-toolbar').first().waitFor({
      state: 'visible',
      timeout: 120_000,
    });
    await assertTouchTargets(page, '.document-detail-page');
  });
});
