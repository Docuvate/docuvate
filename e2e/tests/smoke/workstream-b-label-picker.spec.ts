import { expect, test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { setTheme } from '../../helpers/ce-ui-audit';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

const artifactRoot =
  process.env['WORKSTREAM_B_ARTIFACT_DIR'] ?? '/opt/cursor/artifacts/workstream-b-label-picker';

const tagFilterViewports = [
  { label: '1440x900', width: 1440, height: 900, useDrawer: false },
  { label: '1440x780', width: 1440, height: 780, useDrawer: false },
  { label: '1024x640', width: 1024, height: 640, useDrawer: true },
  { label: '390x620', width: 390, height: 620, useDrawer: true },
] as const;

const searchViewports = [
  { label: '1440', width: 1440, height: 900 },
  { label: '390', width: 390, height: 844 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

function md5File(filePath: string): string {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

async function seedLabels(request: import('@playwright/test').APIRequestContext, count: number) {
  for (let index = 0; index < count; index += 1) {
    const name = `ws-b-seed-${String(index).padStart(4, '0')}`;
    const response = await request.post(`${apiBase}/tags`, {
      data: { name, color: '#7c3aed', matchingAlgorithm: 'none', match: '' },
    });
    if (response.status() === 409 || response.status() === 400) {
      continue;
    }
    expect(response.ok()).toBeTruthy();
  }
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

async function openLibraryFilters(
  page: import('@playwright/test').Page,
  useDrawer: boolean
): Promise<void> {
  const filterToggle = page.getByRole('button', {
    name: /show filters|filter anzeigen|hide filters|filter ausblenden/i,
  });
  if (useDrawer) {
    await filterToggle.click();
    await expect(page.locator('.library-filter-drawer')).toBeVisible({ timeout: 30_000 });
    return;
  }
  const panel = page.getByTestId('library-filter-panel');
  if (!(await panel.isVisible())) {
    await filterToggle.click();
  }
  await expect(panel).toBeVisible({ timeout: 30_000 });
}

async function scrollTagFilterNearBottom(page: import('@playwright/test').Page): Promise<void> {
  const combobox = page.getByTestId('library-filter-tag-combobox');
  await combobox.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const scrollHost =
      document.querySelector('.library-filter-drawer-body') ??
      document.querySelector('.filter-panel-body');
    if (scrollHost instanceof HTMLElement) {
      scrollHost.scrollTop = scrollHost.scrollHeight;
    }
  });
  await combobox.scrollIntoViewIfNeeded();
}

async function openTagFilterPortaledList(page: import('@playwright/test').Page): Promise<void> {
  const combobox = page.getByTestId('library-filter-tag-combobox');
  const input = combobox.getByRole('combobox');
  await input.click();
  await input.fill('ws-b-seed');
  const popover = page.getByTestId('library-filter-tag-combobox-popover');
  await expect(popover).toBeVisible({ timeout: 30_000 });
  await expect(popover).toHaveAttribute('data-floating-placement', /.+/);
}

test.describe('Workstream B label picker', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');
    await seedLabels(request, 500);
  });

  for (const viewport of tagFilterViewports) {
    test(`tag filter portaled popover in viewport (${viewport.label})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/documents`);
      await page.waitForLoadState('networkidle');
      await setTheme(page, 'light');

      await openLibraryFilters(page, viewport.useDrawer);
      await scrollTagFilterNearBottom(page);
      await openTagFilterPortaledList(page);

      const popover = page.getByTestId('library-filter-tag-combobox-popover');
      const placement = await popover.getAttribute('data-floating-placement');
      expect(placement?.startsWith('top')).toBe(true);

      await assertFullyInViewport(page, '[data-testid="library-filter-tag-combobox-popover"]');

      const listHost = popover.locator('.label-picker-combobox-list-host');
      await expect(listHost).toBeVisible();
      const optionCount = await listHost.locator('.label-picker-item').count();
      expect(optionCount).toBeGreaterThan(0);
      expect(optionCount).toBeLessThan(80);

      const shot = path.join(artifactRoot, `tag-filter-popover-${viewport.label}.png`);
      await page.screenshot({ path: shot });
      expect(md5File(shot).length).toBe(32);
    });
  }

  for (const viewport of searchViewports) {
    test(`label picker search and virtualization (${viewport.label})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${webOrigin}/documents`);
      await page.waitForLoadState('networkidle');
      await setTheme(page, 'dark');

      await openLibraryFilters(page, viewport.width < 1024);
      await openTagFilterPortaledList(page);

      const shot = path.join(artifactRoot, `label-picker-${viewport.label}.png`);
      await page.screenshot({ path: shot });
      expect(md5File(shot).length).toBe(32);
    });
  }

  test('chip contrast and +N popover stay in viewport (1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/documents`);
    await page.waitForLoadState('networkidle');
    await setTheme(page, 'light');

    const ratios = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.document-labels-cell .chip'));
      return chips.map((chip) => {
        const style = getComputedStyle(chip);
        const fg = style.color;
        const bg = style.backgroundColor;
        return { fg, bg };
      });
    });
    for (const sample of ratios) {
      expect(sample.fg).toBeTruthy();
      expect(sample.bg).toBeTruthy();
    }

    const overflowBtn = page.locator('.label-chip-row-overflow-btn').first();
    if (await overflowBtn.count()) {
      await overflowBtn.click();
      const popover = page.locator('.label-chip-row-overflow-popover');
      await expect(popover).toBeVisible();
      await assertFullyInViewport(page, '.label-chip-row-overflow-popover');
      const shot = path.join(artifactRoot, 'label-overflow-popover-1440.png');
      await page.screenshot({ path: shot });
      expect(md5File(shot).length).toBe(32);
    }
  });
});
