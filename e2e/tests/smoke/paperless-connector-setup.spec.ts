import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const installationId = 'e2e-paperless-setup-install';

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('Paperless connector setup route', () => {
  test('setup page shows connection and import controls for installation URL', async ({ page }) => {
    const now = '2026-01-01T00:00:00.000Z';

    await page.route('**/v1/remote-config', async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as {
        featureFlags: Record<string, boolean>;
      };
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        json: {
          ...body,
          featureFlags: { ...body.featureFlags, sourceConnectors: true },
        },
      });
    });

    await page.route('**/v1/connectors/installations', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          installations: [
            {
              id: installationId,
              pluginId: 'paperless',
              displayName: 'Paperless-ngx',
              enabled: true,
              sourceScope: { mode: 'all', paths: [] },
              createdAt: now,
              updatedAt: now,
            },
          ],
        }),
      });
    });

    await page.route(
      `**/v1/connectors/installations/${installationId}/paperless/import-runs/latest`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            run: {
              id: 'run-e2e-1',
              installationId,
              status: 'completed',
              paperlessApiVersion: 3,
              ocrMode: 'keep_paperless',
              includeArchivedPdf: false,
              progressProcessed: 2,
              progressTotal: 2,
              fatalErrorKey: null,
              startedAt: now,
              completedAt: now,
              createdAt: now,
              updatedAt: now,
            },
            errors: [
              {
                id: 'err-e2e-1',
                sourceDocumentId: '170',
                sourceDocumentTitle: 'Große Rechnung',
                messageKey: 'connectors.paperlessImport.documentTooLarge',
                messageDetail: null,
                messageParams: { maxMb: 200 },
                createdAt: now,
              },
            ],
          }),
        });
      }
    );

    await page.route(`**/v1/connectors/installations/${installationId}/paperless`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          displayName: 'Paperless-ngx',
          baseUrl: 'https://paperless.example.com',
          keepOcrText: true,
          rerunOcr: false,
          includeArchivedPdf: false,
          hasStoredApiToken: true,
          hasStoredUsername: false,
          hasStoredPassword: false,
          lastSuccessfulModifiedAt: null,
        }),
      });
    });

    await page.goto(`${webOrigin}/settings/connectors/paperless/${installationId}`);

    await expect(page.locator('.paperless-connector-setup')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByPlaceholder('https://paperless.example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /Verbindung testen|Test connection/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Import-Vorschau|Import preview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Import starten$|^Start import$/i })).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: /Fehlgeschlagene erneut importieren|Retry failed imports/i,
      })
    ).toBeVisible();
    await expect(page.getByText(/Große Rechnung/i)).toBeVisible();
    await expect(page.getByText(/über 200 MB|over 200 MB/i)).toBeVisible();
    await expect(page.getByText(/Paperless-ID 170|Paperless ID 170/i)).toBeVisible();
  });
});
