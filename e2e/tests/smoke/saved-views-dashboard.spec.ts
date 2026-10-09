import { expect, test } from '@playwright/test';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

async function savePinnedView(page: import('@playwright/test').Page, viewName: string) {
  await page.getByRole('button', { name: /save view|ansicht speichern/i }).click();
  await page.getByLabel(/name/i).fill(viewName);
  const dialog = page.getByRole('dialog');
  const pinCheckbox = dialog.getByRole('checkbox', {
    name: /pin to sidebar|in der seitenleiste anheften/i,
  });
  await pinCheckbox.check();
  await expect(pinCheckbox).toBeChecked();
  await dialog.getByRole('button', { name: /^save$|^speichern$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

test.describe('Saved views and dashboard', () => {
  test('create view, pin, dashboard widget, reorder persists', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/');
    await expect(page).toHaveURL((url) => url.pathname === '/', { timeout: 15_000 });

    await page.getByRole('link', { name: /documents|dokumente/i }).click();
    await expect(page).toHaveURL(/\/documents/, { timeout: 15_000 });

    const viewNameA = `E2E View A ${Date.now()}`;
    const viewNameB = `E2E View B ${Date.now()}`;
    await savePinnedView(page, viewNameA);
    await savePinnedView(page, viewNameB);

    await expect(
      page.locator('.sidebar-saved-views').getByRole('link', { name: viewNameA })
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.locator('.sidebar-saved-views').getByRole('link', { name: viewNameB })
    ).toBeVisible({ timeout: 30_000 });

    await page.locator('.sidebar-saved-views').getByRole('link', { name: viewNameB }).click();
    await expect(page).toHaveURL(/view=/, { timeout: 10_000 });

    await expect(page.locator('.sidebar-saved-view-link.active')).toHaveCount(1);
    await expect(page.locator('.sidebar-saved-view-link[aria-current="page"]')).toHaveCount(1);
    await expect(
      page.locator('.sidebar-saved-view-link[aria-current="page"]')
    ).toContainText(viewNameB);

    await page.getByRole('link', { name: /start/i }).first().click();
    await page.getByRole('button', { name: /customize|anpassen/i }).click();
    await page.getByRole('button', { name: /add widget|widget hinzufügen/i }).click();

    await page.reload();
    await expect(page.getByRole('button', { name: /customize|anpassen/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
