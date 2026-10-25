import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('Connector catalog (CE)', () => {
  test('catalog API lists Paperless-ngx and SFTP fetch by default', async ({ request }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'compose API not running');

    const res = await request.get(`${apiBase}/v1/connectors/catalog`, {
      headers: { origin: webOrigin },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { plugins: { id: string }[] };
    const ids = body.plugins.map((plugin) => plugin.id);
    expect(ids).toContain('paperless');
    expect(ids).toContain('sftp_fetch');
    expect(ids).not.toContain('sharepoint');
  });

  test('connectors settings page shows Paperless-ngx card with aligned footers', async ({ page }) => {
    const health = await page.request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'compose API not running');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webOrigin}/settings/connectors`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Paperless-ngx/i })).toBeVisible({
      timeout: 30_000,
    });

    const cards = page.locator('.connector-catalog-grid .connector-catalog-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(1);
    const footerTops = await cards.evaluateAll((elements) =>
      elements.map((card) => {
        const footer = card.querySelector('.connector-catalog-card-footer');
        return footer?.getBoundingClientRect().top ?? 0;
      })
    );
    const maxTop = Math.max(...footerTops);
    const minTop = Math.min(...footerTops);
    expect(maxTop - minTop).toBeLessThan(4);
  });
});
