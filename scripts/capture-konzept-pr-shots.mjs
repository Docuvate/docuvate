#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * KONZEPT PR screenshot set (1440 / 1024 / 390, light + dark).
 * Requires: pnpm --filter @docuvate/web dev @ http://localhost:5173
 *   PR_SET=auth|start|shell|documents node scripts/capture-konzept-pr-shots.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const OUT = process.env.SCREENSHOT_DIR ?? '.artifacts/konzept-pr';
const PR_SET = process.env.PR_SET ?? 'start';

const WIDTHS = [1440, 1024, 390];
const HEIGHTS = { 1440: 900, 1024: 900, 390: 844 };

async function setTheme(page, theme) {
  await page.addInitScript(({ t }) => {
    localStorage.setItem('docuvate-theme-preference', t);
    localStorage.setItem('docuvate-theme', t);
    document.documentElement.setAttribute('data-docuvate-theme', t);
  }, { t: theme });
}

async function shotPage(page, fileBase, url, { waitSelector } = {}) {
  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme);
    await page.setViewportSize({ width: 1440, height: HEIGHTS[1440] ?? 900 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    if (waitSelector) {
      await page.locator(waitSelector).first().waitFor({ state: 'visible', timeout: 30_000 });
    }
    for (const width of WIDTHS) {
      const height = HEIGHTS[width] ?? 900;
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);
      const file = path.join(OUT, `${fileBase}-${theme}-${width}.png`);
      await page.screenshot({ path: file, fullPage: width === 390 });
    }
  }
}

function jsonResponse(body) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

async function mockAuthenticatedShell(page, { sourceConnectors = true, documentsTotal = 128 } = {}) {
  const authSessionBody = jsonResponse({
    session: {
      id: 'sess-screenshot',
      userId: 'shot-user',
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    },
    user: {
      id: 'shot-user',
      email: 'screenshot-user@test.local',
      name: 'Screenshot Nutzer',
    },
  });
  await page.route('**/api/auth/**', (route) => route.fulfill(authSessionBody));

  const fulfillApi = (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes('/remote-config')) {
      return route.fulfill(
        jsonResponse({
          featureFlags: {
            layoutReconstructionCompare: false,
            sourceConnectors,
            experimentalResearchModels: false,
            exactAnswers: false,
            smartDuplicates: false,
            answerAbstention: false,
            learnedValueTypes: true,
            layoutKeyValueRoles: false,
            localChatModel: false,
          },
        })
      );
    }
    if (url.includes('/dashboard/statistics')) {
      return route.fulfill(
        jsonResponse({
          documentsTotal,
          byStatus: { uploaded: 2, queued: 0, extracting: 1, ready: 120, failed: 5 },
          labelsAssignedCount: 95,
          unlabeledCount: 25,
          labelsTotalCount: 12,
          topLabels: [
            { name: 'Rechnung', count: 42 },
            { name: 'Vertrag', count: 31 },
            { name: 'Lieferschein', count: 18 },
            { name: 'Intern', count: 12 },
            { name: 'Archiv', count: 9 },
          ],
        })
      );
    }
    if (/\/dashboard(\?|$)/.test(url)) {
      return route.fulfill(
        jsonResponse({
          widgets: [
            { id: 'w1', type: 'upload', position: 0, widthCols: 6, heightRows: 2 },
            { id: 'w2', type: 'statistics', position: 1, widthCols: 6, heightRows: 3 },
            { id: 'w3', type: 'attention', position: 2, widthCols: 12, heightRows: 2, itemLimit: 5 },
          ],
          editMode: false,
        })
      );
    }
    if (url.includes('/review-queue/summary')) {
      return route.fulfill(jsonResponse({ pendingCount: 3 }));
    }
    if (url.includes('/saved-views')) {
      return route.fulfill(jsonResponse({ items: [] }));
    }
    if (url.includes('/tags')) {
      return route.fulfill(
        jsonResponse({
          items: [
            { id: 'tag-inbox', name: 'Posteingang', isInbox: true },
            { id: 'tag-vertrag', name: 'Vertrag', isInbox: false },
            { id: 'tag-versicherung', name: 'Versicherung', isInbox: false },
            { id: 'tag-versorgung', name: 'Versorgung', isInbox: false },
            { id: 'tag-verwaltung', name: 'Verwaltung', isInbox: false },
          ],
        })
      );
    }
    if (url.includes('/recognized-fields/filter-values')) {
      return route.fulfill(
        jsonResponse({
          items: ['Stadtwerke München', 'Nordwind GmbH', 'Beispiel AG'],
        })
      );
    }
    if (url.includes('/folders')) {
      return route.fulfill(jsonResponse({ items: [] }));
    }
    if (url.includes('/mappen')) {
      return route.fulfill(jsonResponse({ items: [] }));
    }
    if (url.includes('/connectors/catalog')) {
      return route.fulfill(
        jsonResponse({
          viewerIsServerAdmin: false,
          categories: [
            {
              id: 'mail',
              labelKey: 'connectors.categories.mail.label',
              descriptionKey: 'connectors.categories.mail.description',
            },
            {
              id: 'storage',
              labelKey: 'connectors.categories.storage.label',
              descriptionKey: 'connectors.categories.storage.description',
            },
            {
              id: 'dms',
              labelKey: 'connectors.categories.dms.label',
              descriptionKey: 'connectors.categories.dms.description',
            },
          ],
          plugins: [
            {
              id: 'gmail',
              categoryId: 'mail',
              labelKey: 'connectors.plugins.gmail.label',
              descriptionKey: 'connectors.plugins.gmail.description',
              capabilities: ['source'],
              tier: 'oss',
              auth: {
                strategy: 'oauth2',
                fields: [],
                oauth: { configured: true, missingEnvVars: [] },
              },
            },
            {
              id: 'amazon_s3',
              categoryId: 'storage',
              labelKey: 'connectors.plugins.amazon_s3.label',
              descriptionKey: 'connectors.plugins.amazon_s3.description',
              capabilities: ['source'],
              tier: 'oss',
              auth: {
                strategy: 'api_key',
                fields: [
                  {
                    key: 'accessKeyId',
                    labelKey: 'connectors.plugins.amazon_s3.fields.accessKeyId',
                    type: 'text',
                    required: true,
                  },
                ],
              },
            },
            {
              id: 'paperless',
              categoryId: 'dms',
              labelKey: 'connectors.plugins.paperless.label',
              descriptionKey: 'connectors.plugins.paperless.description',
              capabilities: ['source'],
              tier: 'oss',
              auth: {
                strategy: 'bearer',
                fields: [
                  {
                    key: 'token',
                    labelKey: 'connectors.plugins.paperless.fields.token',
                    type: 'password',
                    required: true,
                    secret: true,
                  },
                ],
              },
            },
          ],
        })
      );
    }
    if (url.includes('/sftp-ingress/server')) {
      return route.fulfill(
        jsonResponse({
          host: 'sftp.example.local',
          port: 22,
          fingerprintSha256: null,
          enabled: true,
        })
      );
    }
    if (url.includes('/sftp-ingress/accounts')) {
      return route.fulfill(jsonResponse({ accounts: [] }));
    }
    if (url.includes('/connectors/installations')) {
      return route.fulfill(jsonResponse({ installations: [] }));
    }
    if (url.includes('/recognized-fields/filter-values')) {
      return route.fulfill(
        jsonResponse({
          items: ['Beispiel GmbH', 'Muster AG', 'Docuvate Demo'],
        })
      );
    }
    if (url.includes('/recognized-fields')) {
      return route.fulfill(
        jsonResponse({
          items: [
            {
              id: 'field-absender',
              key: 'absender',
              label: 'Absender',
              fieldType: 'text',
              sortOrder: 0,
              extractForAllDocuments: true,
              gateLabelIds: [],
              gateLabelMatch: 'all',
              minLabelConfidence: null,
              confidenceGateEnabled: null,
              showInFilter: true,
            },
          ],
        })
      );
    }
    if (url.includes('/duplicate-sets')) {
      return route.fulfill(
        jsonResponse({
          items: [
            {
              setId: 'set-a|set-b',
              documents: [
                {
                  documentId: 'doc-a',
                  title: 'Rechnung A',
                  filename: 'rechnung-a.pdf',
                  createdAt: new Date().toISOString(),
                },
                {
                  documentId: 'doc-b',
                  title: 'Rechnung B',
                  filename: 'rechnung-b.pdf',
                  createdAt: new Date(Date.now() - 86_400_000).toISOString(),
                },
              ],
              maxSimilarity: 0.98,
              similarityPercent: 98,
              bulkArchiveEligible: true,
              sources: ['hash'],
            },
          ],
        })
      );
    }
    if (url.includes('/duplicate-stack')) {
      return route.fulfill(
        jsonResponse({
          stack: {
            stackId: 'stack-1',
            primaryDocumentId: 'doc-stack-primary',
            members: [
              {
                documentId: 'doc-stack-primary',
                title: 'Vertrag Primär',
                filename: 'vertrag.pdf',
                role: 'primary',
                status: 'ready',
                mimeType: 'application/pdf',
              },
              {
                documentId: 'doc-stack-version',
                title: 'Vertrag Scan',
                filename: 'vertrag-scan.pdf',
                role: 'version',
                status: 'ready',
                mimeType: 'application/pdf',
                similarity: 0.99,
                source: 'hash',
              },
            ],
          },
        })
      );
    }
    if (url.includes('/settings') && method === 'GET') {
      return route.fulfill(jsonResponse({ locale: 'de', theme: 'light' }));
    }
    if (url.includes('/documents') && method === 'GET' && !url.includes('/documents/')) {
      return route.fulfill(
        jsonResponse({
          items: [
            {
              id: 'doc-stack-primary',
              title: 'Vertrag Primär',
              filename: 'vertrag.pdf',
              status: 'ready',
              mimeType: 'application/pdf',
              tags: [],
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              duplicateStack: { stackId: 'stack-1', pendingReview: true, versionCount: 1 },
            },
            {
              id: 'doc-1',
              title: 'Rechnung Beispiel GmbH',
              filename: 'rechnung.pdf',
              status: 'failed',
              mimeType: 'application/pdf',
              tags: [],
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          ],
        })
      );
    }
    return route.fulfill(jsonResponse({}));
  };

  await page.route('**/v1/**', fulfillApi);
  await page.route('**/api/v1/**', fulfillApi);
  await page.route('http://localhost:3001/**', fulfillApi);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'de-DE' });
  const page = await context.newPage();

  if (PR_SET === 'auth') {
    await shotPage(page, 'auth-login', `${BASE}/login`, { waitSelector: '.auth-layout' });
    await shotPage(page, 'auth-register', `${BASE}/register`, { waitSelector: '.auth-layout' });
    await shotPage(page, 'auth-forgot', `${BASE}/forgot-password`, { waitSelector: '.auth-layout' });
    await shotPage(page, 'auth-reset-invalid', `${BASE}/reset-password?token=invalid`, {
      waitSelector: '.auth-layout',
    });
    await shotPage(page, 'auth-backup-code', `${BASE}/login/backup-code`, {
      waitSelector: '.auth-layout',
    });
  } else if (PR_SET === 'start') {
    await mockAuthenticatedShell(page);
    await shotPage(page, 'start-dashboard', `${BASE}/`, { waitSelector: '.dashboard-grid' });
  } else if (PR_SET === 'start-onboarding') {
    await mockAuthenticatedShell(page, { documentsTotal: 0 });
    await shotPage(page, 'start-onboarding', `${BASE}/`, { waitSelector: '.dashboard-onboarding' });
  } else if (PR_SET === 'start-skeleton') {
    await page.route('**/api/auth/get-session**', (route) =>
      route.fulfill(
        jsonResponse({
          session: {
            id: 'sess-screenshot',
            userId: 'shot-user',
            expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          },
          user: {
            id: 'shot-user',
            email: 'screenshot-user@test.local',
            name: 'Screenshot Nutzer',
          },
        })
      )
    );
    await page.route('**/v1/dashboard/statistics**', async (route) => {
      await new Promise((r) => setTimeout(r, 60_000));
      await route.fulfill(jsonResponse({ documentsTotal: 0, byStatus: {}, labelsAssignedCount: 0, unlabeledCount: 0, labelsTotalCount: 0, topLabels: [] }));
    });
    await page.route('**/v1/dashboard**', async (route) => {
      if (route.request().url().includes('/statistics')) return;
      await new Promise((r) => setTimeout(r, 60_000));
      await route.fulfill(jsonResponse({ widgets: [], editMode: false }));
    });
    await page.route('**/v1/**', (route) => {
      const url = route.request().url();
      if (url.includes('/remote-config')) {
        return route.fulfill(
          jsonResponse({
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
          })
        );
      }
      if (url.includes('/review-queue/summary')) return route.fulfill(jsonResponse({ pendingCount: 0 }));
      if (url.includes('/saved-views')) return route.fulfill(jsonResponse({ items: [] }));
      return route.fulfill(jsonResponse({}));
    });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.locator('.dashboard-start-skeleton').waitFor({ state: 'visible', timeout: 15_000 });
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `start-skeleton-${theme}-${width}.png`),
          fullPage: width === 390,
        });
      }
    }
  } else if (PR_SET === 'documents') {
    await mockAuthenticatedShell(page);
    await page.setViewportSize({ width: 1440, height: HEIGHTS[1440] ?? 900 });
    await shotPage(page, 'documents-d1-library-filters', `${BASE}/documents`, {
      waitSelector: '[data-testid="library-filter-panel"]',
    });
    await page.setViewportSize({ width: 1440, height: HEIGHTS[1440] ?? 900 });
    await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="library-filter-tag-combobox"] input').fill('Ver');
    await page.locator('.library-tag-filter-combobox__list').waitFor({ state: 'visible' });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `documents-d1b-label-filter-${theme}-${width}.png`),
          fullPage: width === 390,
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: HEIGHTS[1440] ?? 900 });
    await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="library-filter-absender-combobox"] input').click();
    await page.locator('.library-field-filter-combobox__list').waitFor({ state: 'visible' });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `documents-d1-absender-filter-${theme}-${width}.png`),
          fullPage: width === 390,
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: HEIGHTS[1440] ?? 900 });
    await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
    await page.getByTestId('library-stack-primary-delete').first().click();
    await page.locator('[data-testid="library-primary-delete-dialog"]').waitFor({ state: 'visible' });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `documents-d9-primary-delete-${theme}-${width}.png`),
          fullPage: false,
        });
      }
    }
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: HEIGHTS[1440] ?? 900 });
    await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
    await page.locator('.stack-toggle').first().click();
    await page.locator('.library-row-stack-version .library-inline-action-danger').first().click();
    await page.locator('[data-testid="library-version-delete-dialog"]').waitFor({ state: 'visible' });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `documents-d9b-version-delete-${theme}-${width}.png`),
          fullPage: width === 390,
        });
      }
    }
    await page.keyboard.press('Escape');
    await shotPage(page, 'documents-d11-duplicates-overview', `${BASE}/documents/duplicates`, {
      waitSelector: '[data-testid="duplicates-overview-page"]',
    });
    await page.goto(`${BASE}/documents/duplicates`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="duplicate-set-role-row"] .duplicate-set-role-control button').nth(1).click();
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `documents-d11b-duplicates-role-row-${theme}-${width}.png`),
          fullPage: width === 390,
        });
      }
    }
    await page.locator('[data-testid="duplicate-set-apply-decisions"]').click();
    await page.locator('[data-testid="duplicate-set-role-row"] .duplicate-set-role-control button').last().click();
    await page.locator('[data-testid="duplicate-set-apply-decisions"]').click();
    await page.locator('[data-testid="duplicate-set-delete-dialog"]').waitFor({ state: 'visible' });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `documents-d11-duplicates-delete-dialog-${theme}-${width}.png`),
          fullPage: width === 390,
        });
      }
    }
  } else if (PR_SET === 'shell') {
    await mockAuthenticatedShell(page, { sourceConnectors: false });
    await shotPage(page, 'shell-connectors', `${BASE}/settings/connectors`, {
      waitSelector: '.connector-catalog-grid',
    });
    await shotPage(page, 'shell-header-start', `${BASE}/`, { waitSelector: '.app-topbar' });
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      await page.goto(`${BASE}/settings/connectors`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Verbinden|Connect/i }).first().click();
      await page.locator('.connector-connect-dialog').waitFor({ state: 'visible', timeout: 15_000 });
      for (const width of WIDTHS) {
        const height = HEIGHTS[width] ?? 900;
        await page.setViewportSize({ width, height });
        await page.screenshot({
          path: path.join(OUT, `shell-dialog-${theme}-${width}.png`),
          fullPage: false,
        });
      }
      await page.keyboard.press('Escape');
    }
  } else {
    throw new Error(`Unknown PR_SET: ${PR_SET}`);
  }

  await browser.close();
  console.log('Saved screenshots to', OUT);
}

await main();
