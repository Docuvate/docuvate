import { expect, test } from '@playwright/test';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('document detail layout and chat', () => {
  test('layout workspace keeps stable width across viewer modes', async ({ page }) => {
    await page.goto('/documents');
    const firstDoc = page.locator('[data-ux="document-row"] a').first();
    await firstDoc.click();
    await expect(page.locator('.layout-workspace')).toBeVisible({ timeout: 60_000 });

    const measure = async () => {
      const box = await page.locator('.layout-workspace').boundingBox();
      return box ? { x: Math.round(box.x), width: Math.round(box.width) } : null;
    };

    const original = await measure();
    expect(original).not.toBeNull();

    await page.getByRole('button', { name: /Reconstruction|Rekonstruktion/i }).click();
    const reconstruction = await measure();
    expect(reconstruction?.width).toBe(original?.width);

    await page.getByRole('button', { name: /Compare|Vergleich/i }).click();
    const compare = await measure();
    expect(compare?.width).toBe(original?.width);

    await page
      .getByRole('button', { name: /Slider|Schieberegler/i })
      .click();
    const slider = await measure();
    expect(slider?.width).toBe(original?.width);
  });

  test('document chat tab shows chat beside the viewer', async ({ page }) => {
    await page.goto('/documents');
    await page.locator('[data-ux="document-row"] a').first().click();
    await expect(page.locator('.layout-workspace')).toBeVisible({ timeout: 60_000 });
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
  });
});
