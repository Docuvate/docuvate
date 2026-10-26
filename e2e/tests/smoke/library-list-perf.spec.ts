// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth.js';

const artifactRoot =
  process.env['WORKSTREAM_A_ARTIFACT_DIR'] ?? path.join(process.cwd(), 'test-results', 'library-list-perf');
function isDocumentListApiResponse(url: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return /\/v1\/documents$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

interface ListRequestMetric {
  url: string;
  status: number;
  payloadBytes: number;
}

async function captureViewport(
  page: import('@playwright/test').Page,
  name: string,
  viewport: { width: number; height: number },
  theme: 'light' | 'dark'
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.evaluate((next) => {
    document.documentElement.dataset.docuvateTheme = next;
  }, theme);
  await page.goto('/documents');
  await page.getByTestId('library-doc-virtual-scroll').waitFor({ state: 'visible' });
  await page.screenshot({
    path: path.join(artifactRoot, `${name}-${String(viewport.width)}-${theme}.png`),
    fullPage: false,
  });
}

test.describe('library list performance', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    const script = path.join(process.cwd(), '..', 'scripts', 'seed-library-perf-fixture.mjs');
    execFileSync('node', [script], {
      cwd: path.join(process.cwd(), '..'),
      stdio: 'inherit',
      env: process.env,
    });
  });

  test('first page loads once with DOM and timing budgets', async ({ page }) => {
    const listRequests: ListRequestMetric[] = [];
    page.on('response', async (res) => {
      const url = res.url();
      if (!isDocumentListApiResponse(url, res.request().method())) {
        return;
      }
      const body = await res.body().catch(() => new Uint8Array());
      listRequests.push({
        url,
        status: res.status(),
        payloadBytes: body.byteLength,
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    const started = Date.now();
    await Promise.all([
      page.goto('/documents'),
      page.waitForResponse((res) => isDocumentListApiResponse(res.url(), res.request().method())),
    ]);
    await page
      .getByTestId('library-doc-stack-list')
      .or(page.getByTestId('library-doc-virtual-scroll'))
      .first()
      .waitFor({
        state: 'visible',
      });
    await page
      .locator('.library-doc-stack-item, .library-table-virtualized tbody tr')
      .first()
      .waitFor({
        state: 'visible',
        timeout: 1000,
      });
    const firstRowMs = Date.now() - started;

    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    const perf = {
      capturedAt: new Date().toISOString(),
      viewport: { width: 390, height: 844 },
      firstRowMs,
      domNodeCount: nodeCount,
      listRequestCount: listRequests.length,
      listPayloadBytes: listRequests.reduce((sum, entry) => sum + entry.payloadBytes, 0),
      listRequests,
    };
    fs.writeFileSync(path.join(artifactRoot, 'perf.json'), `${JSON.stringify(perf, null, 2)}\n`);

    expect(listRequests.length).toBe(1);
    expect(firstRowMs).toBeLessThan(1500);
    expect(nodeCount).toBeLessThan(3000);

    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'light');
    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'dark');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'light');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'dark');
  });
});
