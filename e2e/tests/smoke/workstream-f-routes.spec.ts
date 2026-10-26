import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('Workstream F connector routing', () => {
  test('paperless connector detail route is reachable', async ({ page }) => {
    const installationsRes = await page.request.get(`${apiBase}/v1/connectors/installations`, {
      headers: { origin: webOrigin },
    });
    if (!installationsRes.ok()) {
      test.skip();
      return;
    }
    const installations = (await installationsRes.json()) as { id: string; pluginId: string }[];
    const paperless = installations.find((row) => row.pluginId === 'paperless');
    if (!paperless) {
      test.skip();
      return;
    }

    await page.goto(`${webOrigin}/settings/connectors/paperless/${paperless.id}`);
    await expect(page.getByPlaceholderText(/paperless\.example\.com/i)).toBeVisible({ timeout: 60_000 });
    await expect(page).not.toHaveURL(/\/settings\/connectors$/);
  });

  test('paperless connector sources route is reachable', async ({ page }) => {
    const installationsRes = await page.request.get(`${apiBase}/v1/connectors/installations`, {
      headers: { origin: webOrigin },
    });
    if (!installationsRes.ok()) {
      test.skip();
      return;
    }
    const installations = (await installationsRes.json()) as { id: string; pluginId: string }[];
    const paperless = installations.find((row) => row.pluginId === 'paperless');
    if (!paperless) {
      test.skip();
      return;
    }

    await page.goto(
      `${webOrigin}/settings/connectors/paperless/${paperless.id}/sources`
    );
    await expect(page).not.toHaveURL(/\/settings\/connectors$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
  });
});
