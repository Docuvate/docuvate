import { expect, test } from '@playwright/test';

async function initDeLight(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('docuvate-site-theme', 'light');
    localStorage.setItem('docuvate-site-locale', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
}

test.describe('docs sidebar active state', () => {
  test.beforeEach(async ({ page }) => {
    await initDeLight(page);
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('exactly one sidebar entry is active on docs overview', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveText('Übersicht');
  });

  test('quickstart hash keeps Übersicht active', async ({ page }) => {
    await page.goto('/docs#quickstart');
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveText('Übersicht');
  });

  test('self-hosting hash highlights only the Betrieb entry', async ({ page }) => {
    await page.goto('/docs#self-hosting');
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveText('Self-Hosting-Konfiguration');
  });

  test('nested docs route highlights only that entry', async ({ page }) => {
    await page.goto('/docs/backup-und-upgrade');
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.docs-sidebar a[aria-current="page"]')).toHaveText('Backup und Upgrade');
  });

  test('comparison table source markers link to public URLs', async ({ page }) => {
    await page.goto('/docs/vergleiche/paperless-ngx');
    const ref = page.locator('.compare-table a.compare-source-ref').first();
    await expect(ref).toBeVisible();
    const href = await ref.getAttribute('href');
    expect(href).toMatch(/^https:\/\//);
    await expect(page.locator('#compare-ref-P1 a')).toHaveAttribute('href', /^https:\/\//);
  });
});
