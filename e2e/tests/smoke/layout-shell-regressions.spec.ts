import { expect, test, type Page } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const RAW_KEY = /\b(dashboard|combobox|common|auth|documents|library)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;

test.use({ storageState: smokeFixtureStoragePath() });

async function visibleClosedDialogs(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      [...document.querySelectorAll('dialog:not([open])')].filter((dialog) => {
        const rect = dialog.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length
  );
}

test.describe('layout shell regressions', () => {
  for (const path of ['/', '/structure/labels', '/filesystem', '/settings', '/review']) {
    test(`closed dialogs stay hidden on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${webOrigin}${path}`);
      await page.waitForLoadState('networkidle');
      expect(await visibleClosedDialogs(page)).toBe(0);
    });
  }

  test('start page header and widgets span the content width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(webOrigin);
    const pageRoot = page.locator('.dashboard-page');
    await expect(pageRoot).toBeVisible();
    const rootBox = await pageRoot.boundingBox();
    const firstChild = await pageRoot.locator(':scope > *').first().boundingBox();
    expect(rootBox).not.toBeNull();
    expect(firstChild).not.toBeNull();
    if (rootBox && firstChild) {
      expect(firstChild.width).toBeGreaterThan(rootBox.width * 0.9);
    }
    await expect(page.locator('body')).not.toContainText(RAW_KEY);
  });

  test('confirm dialog opens centered with a backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/filesystem`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const dialog = document.querySelector<HTMLDialogElement>('dialog.dv-dialog');
      dialog?.showModal();
    });
    const open = page.locator('dialog.dv-dialog[open]').first();
    await expect(open).toBeVisible();
    const box = await open.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(560);
      expect(Math.abs(box.x + box.width / 2 - 720)).toBeLessThan(2);
      expect(Math.abs(box.y + box.height / 2 - 450)).toBeLessThan(2);
    }
    const backdrop = await open.evaluate(
      (el) => getComputedStyle(el, '::backdrop').backgroundColor
    );
    expect(backdrop).not.toBe('rgba(0, 0, 0, 0)');
  });
});
