import { expect, test } from '@playwright/test';

import {
  openLayoutAdvancedCompare,
  openLayoutDocumentPage,
  uploadLayoutTableDocument,
  verifyDocumentChatRespondsWithin5s,
} from '../../helpers/layout-chat-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

type WorkspaceBox = { x: number; width: number };

async function measureWorkspace(page: import('@playwright/test').Page): Promise<WorkspaceBox | null> {
  const box = await page.locator('.layout-workspace').boundingBox();
  return box ? { x: Math.round(box.x), width: Math.round(box.width) } : null;
}

const VIEWER_MODES = [/Original/i, /^Text$/i] as const;

const SIDE_TABS = [/Overview|Übersicht/i, /Tables|Tabellen/i, /Outline|Gliederung/i, /^Chat$/i] as const;

test.describe('document detail layout and chat', () => {
  test.describe.configure({ mode: 'serial' });

  let layoutDocId: string;

  test.beforeAll(async ({ request }) => {
    layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
  });

  test.beforeEach(async ({ page }) => {
    await openLayoutDocumentPage(page, layoutDocId);
    await page
      .locator('.layout-ir-skeleton')
      .waitFor({ state: 'hidden', timeout: 180_000 })
      .catch(() => undefined);
  });

  test('hides reconstruction quality badge until technical details are enabled', async ({ page }) => {
    await expect(page.locator('.layout-quality-badge')).toHaveCount(0);
    await expect(page.getByText(/Nachbau-Qualität:\s*prüfen/i)).toHaveCount(0);
  });

  test('text mode and side panel render reading blocks, HTML tables, and nested outline', async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.getByTestId('layout-viewer-toolbar').getByRole('radio', { name: /^Text$/i }).click();
    await expect(
      page
        .locator(
          '.extracted-text-reading-paragraph, .extracted-text-reading-heading, .extracted-text-line'
        )
        .first()
    ).toBeVisible({ timeout: 120_000 });

    await page.getByRole('tab', { name: /Tables|Tabellen/i }).click();
    const dataTable = page.locator('table.layout-data-table').first();
    await expect(dataTable).toBeVisible({ timeout: 60_000 });
    await expect(dataTable.locator('thead th').first()).toBeVisible();

    await page.getByRole('tab', { name: /Outline|Gliederung/i }).click();
    await expect(page.locator('.layout-outline-list, .layout-outline-item').first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test('details tab exposes localized document date input', async ({ page }) => {
    await page.getByRole('tab', { name: /Details|Einzelheiten/i }).click();
    const dateInput = page.getByRole('textbox', { name: /Dokumentdatum|Document date/i });
    await expect(dateInput).toBeVisible();
    await expect(dateInput).toHaveAttribute('inputmode', 'numeric');
  });

  test('layout workspace keeps stable width across viewer modes and side tabs', async ({ page }) => {
    test.setTimeout(360_000);

    const baseline = await measureWorkspace(page);
    expect(baseline).not.toBeNull();

    for (const mode of VIEWER_MODES) {
      await page.getByTestId('layout-viewer-toolbar').getByRole('radio', { name: mode }).click();
      await page.waitForTimeout(400);
      const box = await measureWorkspace(page);
      expect(box?.width).toBe(baseline?.width);
      expect(box?.x).toBe(baseline?.x);
    }

    for (const tab of SIDE_TABS) {
      const tabButton = page.getByRole('tab', { name: tab });
      if ((await tabButton.count()) === 0) {
        continue;
      }
      await tabButton.click();
      await page.waitForTimeout(200);
      const box = await measureWorkspace(page);
      expect(box?.width).toBe(baseline?.width);
      expect(box?.x).toBe(baseline?.x);
    }
  });

  test('compare heatmap aligns with original pane and slider clips at 50%', async ({ page }) => {
    test.setTimeout(360_000);

    await openLayoutAdvancedCompare(page);
    await page.locator('[data-testid="layout-compare-stage"]').waitFor({
      state: 'visible',
      timeout: 180_000,
    });
    await page.getByRole('radio', { name: /Slider|Schieberegler/i }).click();
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

    await page.getByRole('radio', { name: /Side by side|Split|Nebeneinander/i }).click();
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

  test('layout chat tab fills the side panel without a duplicate top chat region', async ({ page }) => {
    test.setTimeout(180_000);

    await expect(page.locator('.document-detail-tab-region .doc-chat')).toHaveCount(0);

    await page.getByRole('tab', { name: /^Chat$/i }).click();
    const sidePanel = page.locator('.layout-side-panel--chat');
    await expect(sidePanel).toBeVisible();

    const panelBox = await sidePanel.boundingBox();
    const chatLayout = sidePanel.locator('.doc-chat-layout');
    await expect(chatLayout).toBeVisible();
    const layoutBox = await chatLayout.boundingBox();
    expect(panelBox && layoutBox).toBeTruthy();
    if (panelBox && layoutBox) {
      expect(layoutBox.width).toBeGreaterThan(panelBox.width * 0.82);
    }

    const metaBox = await page.locator('.document-detail-meta').boundingBox();
    const workspaceBox = await page.locator('.layout-workspace').boundingBox();
    expect(metaBox && workspaceBox).toBeTruthy();
    if (metaBox && workspaceBox) {
      expect(workspaceBox.y - metaBox.y - metaBox.height).toBeLessThan(140);
    }
  });

  test('document chat thread generation succeeds on layout fixture', async ({ request }) => {
    test.setTimeout(180_000);
    await verifyDocumentChatRespondsWithin5s(request, apiBase, webOrigin, layoutDocId);
  });

  test('document chat tab shows chat beside the viewer with composer ready', async ({ page }) => {
    test.setTimeout(180_000);

    await page.getByRole('tab', { name: /^Chat$/i }).click();
    const chatPanel = page.locator('.layout-side-chat');
    await expect(chatPanel).toBeVisible();
    const composer = chatPanel.locator('.doc-chat-composer input');
    await expect(composer).toBeEnabled({ timeout: 60_000 });
    const workspaceBox = await page.locator('.layout-workspace').boundingBox();
    const chatBox = await chatPanel.boundingBox();
    expect(workspaceBox && chatBox).toBeTruthy();
    if (workspaceBox && chatBox) {
      expect(chatBox.x).toBeGreaterThan(workspaceBox.x);
    }
  });
});
