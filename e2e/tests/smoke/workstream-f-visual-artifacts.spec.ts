import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const artifactRoot =
  process.env['WORKSTREAM_F_ARTIFACT_DIR'] ?? '/opt/cursor/artifacts/workstream-f';

const viewports = [
  { label: '390', width: 390, height: 844 },
  { label: '1024', width: 1024, height: 900 },
  { label: '1440', width: 1440, height: 900 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('Workstream F visual artifacts', () => {
  test('captures labels and connector routes (light/dark)', async ({ browser }) => {
    test.setTimeout(600_000);
    fs.mkdirSync(artifactRoot, { recursive: true });

    const recsRes = await fetch(`${apiBase}/v1/labels/recommendations`, {
      headers: { origin: webOrigin },
    });
    expect(recsRes.status).toBe(200);

    for (const theme of ['light', 'dark'] as const) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });
        await context.addInitScript(({ themeValue }) => {
          document.documentElement.dataset.theme = themeValue;
          window.localStorage.setItem('docuvate-theme', themeValue);
        }, { themeValue: theme });

        const page = await context.newPage();
        await page.goto(`${webOrigin}/structure/labels`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-ux="page-title"]')).toBeVisible({ timeout: 120_000 });
        const labelsShot = path.join(
          artifactRoot,
          `labels-${viewport.label}-${theme}.png`
        );
        await page.screenshot({ path: labelsShot, fullPage: true });

        const installationsRes = await page.request.get(`${apiBase}/v1/connectors/installations`, {
          headers: { origin: webOrigin },
        });
        if (installationsRes.ok()) {
          const installations = (await installationsRes.json()) as { id: string; pluginId: string }[];
          const paperless = installations.find((row) => row.pluginId === 'paperless');
          if (paperless) {
            await page.goto(`${webOrigin}/settings/connectors/paperless/${paperless.id}`);
            await page.waitForLoadState('networkidle');
            await expect(page.getByPlaceholderText(/paperless\.example\.com/i)).toBeVisible({
              timeout: 120_000,
            });
            const connectorShot = path.join(
              artifactRoot,
              `connector-paperless-${viewport.label}-${theme}.png`
            );
            await page.screenshot({ path: connectorShot, fullPage: true });
          }
        }

        await context.close();
      }
    }
  });
});
