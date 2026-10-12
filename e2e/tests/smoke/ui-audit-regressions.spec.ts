import { expect, test } from '@playwright/test';

import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

async function openAdvancedCompare(page: import('@playwright/test').Page) {
  await page.locator('.layout-advanced-summary').click();
  await page.getByRole('radio', { name: /Vergleich|Compare/i }).click();
  await page.locator('[data-testid="layout-compare-stage"]').waitFor({
    state: 'visible',
    timeout: 180_000,
  });
}

test.describe('UI audit regressions (non-ML)', () => {
  test.describe.configure({ mode: 'serial' });

  let layoutDocId: string;

  test.beforeAll(async ({ request }) => {
    layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
  });

  test('document detail: Original|Text modes and no SSIM in default compare chrome', async ({ page }) => {
    test.setTimeout(360_000);
    await openLayoutDocumentPage(page, layoutDocId);

    const toolbar = page.locator('.layout-viewer-toolbar');
    const stage = page.locator('.layout-viewer-stage');
    await toolbar.waitFor({ state: 'visible', timeout: 120_000 });
    await stage.waitFor({ state: 'visible', timeout: 120_000 });
    const toolbarBox = await toolbar.boundingBox();
    const stageBox = await stage.boundingBox();
    expect(toolbarBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    const gap = (stageBox?.y ?? 0) - (toolbarBox?.bottom ?? 0);
    expect(Number.isFinite(gap)).toBe(true);
    expect(gap).toBeLessThan(120);

    await page.getByRole('radio', { name: /^Text$/i }).click();
    await expect(page.locator('[data-block-id], [data-block-index]').first()).toBeVisible({
      timeout: 60_000,
    });

    await openAdvancedCompare(page);
    const bodyText = await page.locator('.layout-compare').innerText();
    expect(bodyText).not.toMatch(/SSIM/i);
  });

  test('locale switcher uses filled segmented control', async ({ page }) => {
    await page.goto(webOrigin);
    const de = page.getByRole('radio', { name: /DE|Deutsch/i }).first();
    await expect(de).toBeVisible();
    await expect(de).toHaveAttribute('aria-checked', 'true');
  });

  test('settings extraction shows offline callout copy when engines fail', async ({ page }) => {
    await page.route('**/v1/settings/extraction-engines', (route) => {
      void route.fulfill({ status: 503, body: 'unavailable' });
    });
    await page.goto(`${webOrigin}/settings`);
    await expect(page.getByText(/Verarbeitungsdienst|processing service/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
