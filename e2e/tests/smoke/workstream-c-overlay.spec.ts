import { expect, test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { setTheme } from '../../helpers/ce-ui-audit';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const artifactRoot =
  process.env['WORKSTREAM_C_ARTIFACT_DIR'] ?? '/opt/cursor/artifacts/workstream-c-overlay';

const viewports = [
  { label: '1440', width: 1440, height: 900 },
  { label: '1024', width: 1024, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

function md5File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

async function assertFullyInViewport(
  page: import('@playwright/test').Page,
  selector: string
): Promise<void> {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  expect(box).toBeTruthy();
  expect(viewport).toBeTruthy();
  if (!box || !viewport) {
    return;
  }
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
}

test.describe('Workstream C overlay regressions', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
  });

  for (const viewport of viewports.filter((v) => v.label !== '1440')) {
    test(`filter drawer footer action is visible (${viewport.label})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/documents`);
      await page.waitForLoadState('networkidle');
      const filterToggle = page.getByRole('button', {
        name: /show filters|filter anzeigen|hide filters|filter ausblenden/i,
      });
      await filterToggle.click();
      const footerBtn = page.locator('.library-filter-drawer-footer .btn');
      await expect(footerBtn).toBeVisible({ timeout: 30_000 });
      await footerBtn.scrollIntoViewIfNeeded();
      await expect(footerBtn).toBeEnabled();
      await footerBtn.click({ trial: true });

      if (viewport.label === '1024' || viewport.label === '390') {
        const shot = path.join(artifactRoot, `filter-drawer-${viewport.label}.png`);
        await page.screenshot({ path: shot });
        expect(md5File(shot).length).toBe(32);
      }
    });
  }

  async function captureComboboxNearBottom(
    page: import('@playwright/test').Page,
    shotPath: string
  ): Promise<void> {
    await page.goto(`${webOrigin}/documents`);
    await page.waitForLoadState('networkidle');
    const filterToggle = page.getByRole('button', {
      name: /show filters|filter anzeigen|hide filters|filter ausblenden/i,
    });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }
    await page.evaluate(() => {
      const body = document.querySelector('.library-filter-drawer-body, .filter-panel-body');
      if (body instanceof HTMLElement) {
        body.scrollTop = body.scrollHeight;
      }
    });
    const combobox = page.getByRole('combobox').first();
    await combobox.click();
    await combobox.fill('a');
    const list = page.locator('[data-floating-placement]').first();
    await expect(list).toBeVisible({ timeout: 15_000 });
    await assertFullyInViewport(page, '[data-floating-placement]');
    await page.screenshot({ path: shotPath });
    expect(md5File(shotPath).length).toBe(32);
  }

  test('combobox list stays within viewport near page bottom (1440 light+dark)', async ({
    browser,
  }) => {
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        storageState: smokeFixtureStoragePath(),
      });
      const page = await context.newPage();
      await setTheme(page, theme);
      await captureComboboxNearBottom(
        page,
        path.join(artifactRoot, `combobox-bottom-1440-${theme}.png`)
      );
      await context.close();
    }
  });

  for (const viewport of viewports.filter((v) => v.label !== '1440')) {
    test(`combobox list within viewport (${viewport.label})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await captureComboboxNearBottom(
        page,
        path.join(artifactRoot, `combobox-bottom-${viewport.label}.png`)
      );
    });
  }

  test('document overflow menu stacks above detail tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/documents`);
    await page.waitForLoadState('networkidle');
    const firstDoc = page.locator('.library-table tbody tr a').first();
    await firstDoc.click();
    await page.waitForURL(/\/documents\//);
    const overflow = page.getByRole('button', { name: /more actions|weitere aktionen/i });
    await overflow.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const tabs = page.locator('.detail-tabs-bar');
    const menuOnTop = await page.evaluate(() => {
      const menuEl = document.querySelector('[role="menu"]');
      if (!(menuEl instanceof HTMLElement)) {
        return false;
      }
      const rect = menuEl.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + Math.min(rect.height / 2, 24);
      const hit = document.elementFromPoint(x, y);
      return hit instanceof Node && menuEl.contains(hit);
    });
    expect(menuOnTop).toBe(true);
    await expect(tabs).toBeVisible();
    const shot = path.join(artifactRoot, 'overflow-menu-1440.png');
    await page.screenshot({ path: shot });
    expect(md5File(shot).length).toBe(32);
  });
});
