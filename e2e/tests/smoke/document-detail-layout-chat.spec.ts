import { expect, test } from '@playwright/test';

import { openLayoutDocumentPage, uploadLayoutTableDocument } from '../../helpers/layout-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

type WorkspaceBox = { x: number; width: number };

async function measureWorkspace(page: import('@playwright/test').Page): Promise<WorkspaceBox | null> {
  const box = await page.locator('.layout-workspace').boundingBox();
  return box ? { x: Math.round(box.x), width: Math.round(box.width) } : null;
}

const VIEWER_MODES = [/Original/i, /Reconstruction|Nachbau/i, /Compare|Vergleich/i] as const;

const SIDE_TABS = [/Fields|Felder/i, /Tables|Tabellen/i, /Outline|Gliederung/i, /Export/i] as const;

test.describe('document detail layout and chat', () => {
  test.describe.configure({ mode: 'serial' });

  let layoutDocId: string;

  test.beforeAll(async ({ request }) => {
    layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
  });

  test.beforeEach(async ({ page }) => {
    await openLayoutDocumentPage(page, layoutDocId);
  });

  test('layout workspace keeps stable width across viewer modes and side tabs', async ({ page }) => {
    test.setTimeout(360_000);

    const baseline = await measureWorkspace(page);
    expect(baseline).not.toBeNull();

    for (const mode of VIEWER_MODES) {
      await page.getByRole('button', { name: mode }).click();
      await page.waitForTimeout(400);
      const box = await measureWorkspace(page);
      expect(box?.width).toBe(baseline?.width);
      expect(box?.x).toBe(baseline?.x);
    }

    await page.getByRole('button', { name: /Compare|Vergleich/i }).click();
    await page.getByRole('button', { name: /Slider|Schieberegler/i }).click();
    await page.waitForTimeout(400);
    const sliderModeBox = await measureWorkspace(page);
    expect(sliderModeBox?.width).toBe(baseline?.width);
    expect(sliderModeBox?.x).toBe(baseline?.x);

    for (const tab of SIDE_TABS) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForTimeout(200);
      const box = await measureWorkspace(page);
      expect(box?.width).toBe(baseline?.width);
      expect(box?.x).toBe(baseline?.x);
    }
  });

  test('compare heatmap aligns with original pane and slider clips at 50%', async ({ page }) => {
    test.setTimeout(360_000);

    await page.getByRole('button', { name: /Compare|Vergleich/i }).click();
    await page.getByRole('button', { name: /Slider|Schieberegler/i }).click();
    const sliderInput = page.locator('.layout-compare-slider-input');
    await sliderInput.waitFor({ state: 'visible', timeout: 120_000 });
    await sliderInput.fill('50');
    const reveal = page.locator('.layout-compare-slider-reveal');
    await expect(reveal).toHaveCSS('clip-path', 'inset(0px 50% 0px 0px)');

    const baseWidth = await page.locator('.layout-compare-slider-base').evaluate((img) => {
      return img instanceof HTMLImageElement ? img.getBoundingClientRect().width : 0;
    });
    const revealImgWidth = await page.locator('.layout-compare-slider-reveal-img').evaluate((img) => {
      return img instanceof HTMLImageElement ? img.getBoundingClientRect().width : 0;
    });
    expect(Math.abs(revealImgWidth - baseWidth)).toBeLessThan(3);

    await page.getByRole('button', { name: /Split|Nebeneinander/i }).click();
    await page.locator('.layout-compare-split').waitFor({ state: 'visible', timeout: 120_000 });
    const heatmapToggle = page.getByRole('checkbox', { name: /heatmap|Heatmap|Abweichungs/i });
    await expect(heatmapToggle).toBeVisible({ timeout: 120_000 });
    await heatmapToggle.check();
    const paneMedia = page.locator('.layout-compare-split .layout-compare-pane-media').first();
    const heatmap = page.locator('.layout-compare-split .layout-compare-heatmap').first();
    await expect(heatmap).toBeVisible({ timeout: 120_000 });
    const paneBox = await paneMedia.boundingBox();
    const heatBox = await heatmap.boundingBox();
    expect(paneBox && heatBox).toBeTruthy();
    if (paneBox && heatBox) {
      expect(Math.abs(heatBox.x - paneBox.x)).toBeLessThan(2);
      expect(Math.abs(heatBox.y - paneBox.y)).toBeLessThan(2);
      expect(Math.abs(heatBox.width - paneBox.width)).toBeLessThan(2);
    }
  });

  test('document chat tab shows chat beside the viewer and answers within 5 seconds', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.getByRole('tab', { name: /^Chat$/i }).click();
    await expect(page.locator('.layout-side-panel-chat')).toBeVisible();
    const composer = page.locator('.layout-side-panel-chat .doc-chat-composer input');
    await expect(composer).toBeEnabled({ timeout: 60_000 });
    const workspaceBox = await page.locator('.layout-workspace').boundingBox();
    const chatBox = await page.locator('.layout-side-panel-chat').boundingBox();
    expect(workspaceBox && chatBox).toBeTruthy();
    if (workspaceBox && chatBox) {
      expect(chatBox.x).toBeGreaterThan(workspaceBox.x);
    }

    const started = Date.now();
    await composer.fill('Welche Tabellen erkennst du in diesem Dokument?');
    await page.locator('.layout-side-panel-chat button.doc-chat-submit').click();
    await expect(page.locator('.doc-chat-assistant-content').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.doc-chat-assistant-pending')).toHaveCount(0, { timeout: 60_000 });
    expect(Date.now() - started).toBeLessThan(5_000);
  });
});
