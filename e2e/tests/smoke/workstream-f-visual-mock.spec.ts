import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactRoot =
  process.env['WORKSTREAM_F_ARTIFACT_DIR'] ?? '/opt/cursor/artifacts/workstream-f';

const viewports = [
  { label: '390', width: 390, height: 844 },
  { label: '1024', width: 1024, height: 900 },
  { label: '1440', width: 1440, height: 900 },
] as const;

const mockSession = {
  session: { id: 'mock-session', token: 'mock-token' },
  user: { id: 'mock-user', email: 'mock@fixture.test', name: 'Mock User' },
};

const mockFeatureFlags = {
  featureFlags: {
    layoutReconstructionCompare: false,
    sourceConnectors: true,
    experimentalResearchModels: false,
    exactAnswers: false,
    smartDuplicates: false,
    answerAbstention: false,
    learnedValueTypes: true,
    layoutKeyValueRoles: false,
    localChatModel: false,
  },
};

async function installApiMocks(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/auth/get-session**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
  });
  const fulfillRemoteConfig = async (route: import('@playwright/test').Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockFeatureFlags),
    });
  };
  await page.route('**/api/v1/remote-config**', fulfillRemoteConfig);
  await page.route('**/v1/remote-config**', fulfillRemoteConfig);
  await page.route('**/api/v1/labels/recommendations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });
  await page.route('**/api/v1/tags**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/v1/labels/map**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        points: [],
        documentCount: 0,
        tagCount: 0,
        extractedDocumentCount: 0,
        emptyReason: null,
        coverageSummary: null,
      }),
    });
  });
  await page.route('**/api/v1/documents**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/api/v1/documents/review-queue/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ pendingCount: 0 }),
    });
  });
  await page.route('**/api/v1/connectors/catalog**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        categories: [{ id: 'import', labelKey: 'connectors.categories.import.label' }],
        plugins: [
          {
            id: 'paperless',
            categoryId: 'import',
            labelKey: 'connectors.paperless.label',
            descriptionKey: 'connectors.paperless.description',
          },
        ],
      }),
    });
  });
  await page.route('**/api/v1/connectors/installations**', async (route) => {
    const url = route.request().url();
    if (url.includes('/paperless')) {
      await route.fallback();
      return;
    }
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        installations: [
          {
            id: 'paperless-mock-1',
            pluginId: 'paperless',
            displayName: 'Paperless-ngx',
            enabled: true,
            sourceScope: { mode: 'all', paths: [] },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    });
  });
  await page.route('**/api/v1/connectors/installations/*/paperless**', async (route) => {
    const url = route.request().url();
    if (url.includes('/import-runs/')) {
      await route.fulfill({ status: 404, body: 'not found' });
      return;
    }
    if (url.includes('/test-connection') || url.includes('/dry-run') || url.includes('/import')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
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
  await page.route('**/api/v1/user-preferences**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

test.describe('Workstream F visual artifacts (mocked API)', () => {
  test('captures labels and connector pages', async ({ browser }) => {
    test.setTimeout(300_000);
    fs.mkdirSync(artifactRoot, { recursive: true });

    for (const theme of ['light', 'dark'] as const) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });
        await context.addInitScript(({ themeValue }) => {
          document.documentElement.dataset.theme = themeValue;
          window.localStorage.setItem('docuvate-theme', themeValue);
          window.localStorage.setItem('i18nextLng', 'en');
        }, { themeValue: theme });

        const page = await context.newPage();
        await installApiMocks(page);

        await page.goto('/structure/labels');
        await page.locator('[data-ux="page-title"]').waitFor({ state: 'visible', timeout: 60_000 });
        await page.screenshot({
          path: path.join(artifactRoot, `labels-${viewport.label}-${theme}.png`),
          fullPage: true,
        });

        await page.goto('/settings/connectors/paperless/paperless-mock-1');
        await page.getByPlaceholder('https://paperless.example.com').waitFor({
          state: 'visible',
          timeout: 60_000,
        });
        await page.screenshot({
          path: path.join(artifactRoot, `connector-paperless-${viewport.label}-${theme}.png`),
          fullPage: true,
        });

        await context.close();
      }
    }
  });
});
