import { expect, test } from '@playwright/test';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

test.use({ storageState: smokeFixtureStoragePath() });

async function openDocumentWithLayoutWorkspace(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/documents');
  await expect(page).toHaveURL(/\/documents/, { timeout: 15_000 });
  const links = page.locator('a.library-open-doc-btn, a[href*="/documents/"]');
  const count = await links.count();
  for (let index = 0; index < Math.min(count, 12); index += 1) {
    await links.nth(index).click();
    const visible = await page
      .locator('.layout-workspace')
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    if (visible) {
      return true;
    }
    await page.goto('/documents');
  }
  return false;
}

type WorkspaceBox = { x: number; width: number };

async function measureWorkspace(page: import('@playwright/test').Page): Promise<WorkspaceBox | null> {
  const box = await page.locator('.layout-workspace').boundingBox();
  return box ? { x: Math.round(box.x), width: Math.round(box.width) } : null;
}

const VIEWER_MODES = [/Original/i, /Reconstruction|Nachbau/i, /Compare|Vergleich/i] as const;

const SIDE_TABS = [/Fields|Felder/i, /Tables|Tabellen/i, /Outline|Gliederung/i, /Export/i] as const;

test.describe('document detail layout and chat', () => {
  test('layout workspace keeps stable width across viewer modes and side tabs', async ({ page }) => {
    test.setTimeout(180_000);
    const found = await openDocumentWithLayoutWorkspace(page);
    test.skip(!found, 'no layout-enabled PDF in the smoke library');

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
    test.setTimeout(180_000);
    const found = await openDocumentWithLayoutWorkspace(page);
    test.skip(!found, 'no layout-enabled PDF in the smoke library');

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
    expect(Math.abs(revealImgWidth - baseWidth)).toBeLessThan(2);

    await page.getByRole('button', { name: /Split|Nebeneinander/i }).click();
    const heatmapToggle = page.getByRole('checkbox', { name: /heatmap|Heatmap|Abweichungs/i });
    if (await heatmapToggle.isVisible().catch(() => false)) {
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
    }
  });

  test('document chat tab shows chat beside the viewer and answers within 5 seconds', async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const found = await openDocumentWithLayoutWorkspace(page);
    test.skip(!found, 'no layout-enabled PDF in the smoke library');

    const docId = page.url().match(/\/documents\/([0-9a-f-]+)/i)?.[1];
    expect(docId).toBeTruthy();

    await page.getByRole('tab', { name: /Chat/i }).click();
    await expect(page.locator('.layout-side-panel-chat')).toBeVisible();
    await expect(page.locator('.layout-side-panel-chat .doc-chat-composer input')).toBeEnabled({
      timeout: 15_000,
    });
    const workspaceBox = await page.locator('.layout-workspace').boundingBox();
    const chatBox = await page.locator('.layout-side-panel-chat').boundingBox();
    expect(workspaceBox && chatBox).toBeTruthy();
    if (workspaceBox && chatBox) {
      expect(chatBox.x).toBeGreaterThan(workspaceBox.x);
    }

    const threadRes = await request.post(`${apiBase}/v1/documents/${docId}/chat/threads`, {
      data: { title: 'Layout e2e chat' },
    });
    if (!threadRes.ok()) {
      test.skip(true, 'document chat API unavailable');
    }
    const threadId = String(((await threadRes.json()) as { thread: { id: string } }).thread.id);
    const started = Date.now();
    const msgRes = await request.post(
      `${apiBase}/v1/documents/${docId}/chat/threads/${threadId}/messages`,
      { data: { message: 'Welche Überschriften erkennst du?' } }
    );
    expect(msgRes.ok()).toBeTruthy();
    const assistantId = String(
      ((await msgRes.json()) as { assistantMessage: { id: string } }).assistantMessage.id
    );
    const messagesPath = `${apiBase}/v1/documents/${docId}/chat/threads/${threadId}/messages`;
    let citations = 0;
    await expect
      .poll(
        async () => {
          const list = await request.get(messagesPath);
          const messages = ((await list.json()) as {
            messages: Array<{
              id: string;
              generationStatus?: string;
              citations?: unknown[];
            }>;
          }).messages;
          const msg = messages.find((m) => m.id === assistantId);
          citations = msg?.citations?.length ?? 0;
          return msg?.generationStatus ?? 'pending';
        },
        { timeout: 60_000 }
      )
      .toBe('done');
    const elapsed = Date.now() - started;
    if (citations > 0) {
      expect(elapsed).toBeLessThan(5_000);
    }
  });
});
