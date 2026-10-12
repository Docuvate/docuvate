import { expect, test } from '@playwright/test';

import {
  openLayoutAdvancedCompare,
  openLayoutDocumentPage,
  uploadLayoutTableDocument,
} from '../../helpers/layout-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

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
    await expect(
      page.locator('.extracted-text-line, .extracted-text-segment, .extraction-text').first()
    ).toBeVisible({
      timeout: 120_000,
    });

    await openLayoutAdvancedCompare(page);
    await expect(page.locator('.layout-compare-ssim-summary')).toHaveCount(0);
  });

  test('locale switcher uses filled segmented control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(webOrigin);
    const localeGroup = page.locator('.locale-switcher-wrap--topbar .segmented-control');
    await expect(localeGroup).toBeVisible();
    const selected = localeGroup.locator('.segmented-control__option--selected');
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveAttribute('aria-checked', 'true');
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
