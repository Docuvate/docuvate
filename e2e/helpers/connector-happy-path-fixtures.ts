// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Page, Route } from '@playwright/test';

export const CONNECTOR_HAPPY_PATH_INSTALLATION_ID = 'e2e-connector-happy-path';
export const CONNECTOR_HAPPY_PATH_RUN_ID = 'e2e-connector-run-1';

const NOW = '2026-03-01T12:00:00.000Z';

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function installConnectorHappyPathMocks(page: Page): Promise<void> {
  await page.route('**/v1/remote-config', async (route) => {
    const response = await route.fetch();
    const raw: unknown = await response.json().catch(() => ({}));
    const body = isRecord(raw) ? raw : {};
    const flagsRaw = body['featureFlags'];
    const flags = isRecord(flagsRaw) ? flagsRaw : {};
    await json(route, {
      ...body,
      featureFlags: { ...flags, sourceConnectors: true },
    }, response.status());
  });

  await page.route('**/v1/connectors/catalog', async (route) => {
    await json(route, {
      categories: [
        { id: 'dms', labelKey: 'connectors.categories.dms' },
        { id: 'storage', labelKey: 'connectors.categories.storage' },
      ],
      plugins: [
        {
          id: 'paperless',
          categoryId: 'dms',
          labelKey: 'connectors.plugins.paperless.label',
          descriptionKey: 'connectors.plugins.paperless.description',
          auth: 'api_token',
          capabilities: ['import'],
        },
        {
          id: 'sftp_fetch',
          categoryId: 'storage',
          labelKey: 'connectors.plugins.sftp_fetch.label',
          descriptionKey: 'connectors.plugins.sftp_fetch.description',
          auth: 'password',
          capabilities: ['import'],
        },
      ],
      viewerIsServerAdmin: true,
    });
  });

  await page.route('**/v1/connectors/installations', async (route) => {
    if (route.request().method() === 'GET') {
      await json(route, {
        installations: [
          {
            id: CONNECTOR_HAPPY_PATH_INSTALLATION_ID,
            pluginId: 'paperless',
            displayName: 'Paperless-ngx Happy Path',
            enabled: true,
            sourceScope: { mode: 'all', paths: [] },
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
      });
      return;
    }
    if (route.request().method() === 'POST') {
      await json(
        route,
        {
          id: CONNECTOR_HAPPY_PATH_INSTALLATION_ID,
          pluginId: 'paperless',
          displayName: 'Paperless-ngx Happy Path',
          enabled: true,
          sourceScope: { mode: 'all', paths: [] },
          createdAt: NOW,
          updatedAt: NOW,
        },
        201
      );
      return;
    }
    await route.continue();
  });

  const paperlessBase = `**/v1/connectors/installations/${CONNECTOR_HAPPY_PATH_INSTALLATION_ID}/paperless`;

  await page.route(`${paperlessBase}/test-connection`, async (route) => {
    await json(route, { ok: true, apiVersion: 3 });
  });

  await page.route(`${paperlessBase}/dry-run`, async (route) => {
    await json(route, {
      summary: {
        documentCount: 2,
        tagCount: 1,
        correspondentCount: 1,
        documentTypeCount: 1,
        storagePathCount: 0,
        customFieldCount: 0,
        mappingConflicts: [],
        paperlessApiVersion: 3,
      },
    });
  });

  await page.route(`${paperlessBase}/import`, async (route) => {
    await json(route, {
      run: {
        id: CONNECTOR_HAPPY_PATH_RUN_ID,
        installationId: CONNECTOR_HAPPY_PATH_INSTALLATION_ID,
        status: 'running',
        paperlessApiVersion: 3,
        ocrMode: 'keep_paperless',
        includeArchivedPdf: false,
        progressProcessed: 0,
        progressTotal: 2,
        fatalErrorKey: null,
        startedAt: NOW,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });
  });

  await page.route(`${paperlessBase}/import-runs/latest`, async (route) => {
    await json(route, {
      run: {
        id: CONNECTOR_HAPPY_PATH_RUN_ID,
        installationId: CONNECTOR_HAPPY_PATH_INSTALLATION_ID,
        status: 'completed',
        paperlessApiVersion: 3,
        ocrMode: 'keep_paperless',
        includeArchivedPdf: false,
        progressProcessed: 2,
        progressTotal: 2,
        fatalErrorKey: null,
        startedAt: NOW,
        completedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      },
      errors: [],
    });
  });

  await page.route(paperlessBase, async (route) => {
    const method = route.request().method();
    if (method === 'GET' || method === 'PUT') {
      await json(route, {
        displayName: 'Paperless-ngx Happy Path',
        baseUrl: 'https://paperless.test.local',
        keepOcrText: true,
        rerunOcr: false,
        includeArchivedPdf: false,
        hasStoredApiToken: true,
        hasStoredUsername: false,
        hasStoredPassword: false,
        lastSuccessfulModifiedAt: NOW,
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/v1/connectors/plugins/paperless/test-connection', async (route) => {
    await json(route, { ok: true, apiVersion: 3 });
  });

  await page.route('**/v1/connectors/plugins/sftp_fetch/probe-host-key', async (route) => {
    await json(route, {
      hostKeyFingerprint: 'SHA256:e2eHappyPathFixtureFingerprint',
      hostKeyAlgorithm: 'ssh-ed25519',
    });
  });
}
