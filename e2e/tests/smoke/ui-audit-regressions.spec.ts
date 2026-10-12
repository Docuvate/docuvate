import { expect, test } from '@playwright/test';

import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

async function openAdvancedCompare(page: import('@playwright/test').Page) {
  await page
    .locator('.layout-ir-skeleton')
    .waitFor({ state: 'hidden', timeout: 180_000 })
    .catch(() => undefined);
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

    const toolbar = page.getByTestId('layout-viewer-toolbar');
    const stage = page.getByTestId('layout-viewer-stage');
    await toolbar.waitFor({ state: 'visible', timeout: 120_000 });
    await stage.waitFor({ state: 'visible', timeout: 120_000 });
    const adjacent = await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="layout-viewer-toolbar"]');
      const viewer = document.querySelector('[data-testid="layout-viewer-stage"]');
      if (!bar?.parentElement || !viewer) {
        return false;
      }
      const siblings = [...bar.parentElement.children];
      const barIndex = siblings.indexOf(bar);
      const stageIndex = siblings.indexOf(viewer);
      return stageIndex === barIndex + 1;
    });
    expect(adjacent).toBe(true);

    await page.getByTestId('layout-viewer-toolbar').getByRole('radio', { name: /^Text$/i }).click();
    await expect(page.locator('.extracted-text-panel')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.extracted-text-line, .extracted-text-segment').first()).toBeVisible({
      timeout: 120_000,
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
