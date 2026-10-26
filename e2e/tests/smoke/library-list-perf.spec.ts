// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  applyDocuvateThemePreference,
  readDocBodyBackground,
} from '../../helpers/docuvate-theme.js';
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
  durationMs: number | null;
}

async function captureViewport(
  page: import('@playwright/test').Page,
  name: string,
  viewport: { width: number; height: number },
  theme: 'light' | 'dark'
): Promise<void> {
  await page.setViewportSize(viewport);
  await applyDocuvateThemePreference(page, theme);
  await page.goto('/documents');
  await page.getByTestId('library-doc-virtual-scroll').waitFor({ state: 'visible' });
  const bg = await readDocBodyBackground(page);
  expect(bg).not.toBe('');
  await page.screenshot({
    path: path.join(artifactRoot, `${name}-${String(viewport.width)}-${theme}.png`),
    fullPage: false,
  });
}

async function assertStatusColumnAlignment(page: import('@playwright/test').Page): Promise<void> {
  const header = page.locator('.library-table-virtualized thead th.library-col-status');
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  const headerX = headerBox?.x ?? 0;

  const statusCells = page.locator('.library-table-virtual-body tr.library-table-virtual-row td.library-col-status');
  const count = await statusCells.count();
  const rowsToCheck = Math.min(20, count);
  expect(rowsToCheck).toBeGreaterThan(0);

  for (let i = 0; i < rowsToCheck; i += 1) {
    const box = await statusCells.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box?.x ?? 0) - headerX)).toBeLessThan(1);
  }
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
    let listResponseAtMs: number | null = null;
    const navigationStarted = Date.now();

    page.on('response', async (res) => {
      const url = res.url();
      if (!isDocumentListApiResponse(url, res.request().method())) {
        return;
      }
      const timing = res.request().timing();
      const body = await res.body().catch(() => new Uint8Array());
      listRequests.push({
        url,
        status: res.status(),
        payloadBytes: body.byteLength,
        durationMs: timing.responseEnd > 0 ? timing.responseEnd - timing.requestStart : null,
      });
      if (listResponseAtMs === null) {
        listResponseAtMs = Date.now() - navigationStarted;
      }
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await applyDocuvateThemePreference(page, 'light');
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
    const navigationTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (!nav || nav.entryType !== 'navigation') {
        return null;
      }
      return {
        domContentLoadedMs: nav.domContentLoadedEventEnd,
        loadEventEndMs: nav.loadEventEnd,
        transferSize: nav.transferSize,
      };
    });

    const perf = {
      capturedAt: new Date().toISOString(),
      viewport: { width: 390, height: 844 },
      firstRowMs,
      listResponseAtMs,
      domNodeCount: nodeCount,
      listRequestCount: listRequests.length,
      listPayloadBytes: listRequests.reduce((sum, entry) => sum + entry.payloadBytes, 0),
      listRequests,
      navigationTiming,
      notes: {
        includeTagSuggestions: false,
        explicitLimit: 50,
      },
    };
    fs.writeFileSync(path.join(artifactRoot, 'perf.json'), `${JSON.stringify(perf, null, 2)}\n`);

    expect(listRequests.length).toBe(1);
    expect(listRequests[0]?.url).toContain('limit=50');
    expect(listRequests[0]?.url).not.toContain('includeTagSuggestions=true');
    expect(firstRowMs).toBeLessThan(1000);
    expect(nodeCount).toBeLessThan(3000);

    await page.setViewportSize({ width: 1440, height: 900 });
    await applyDocuvateThemePreference(page, 'light');
    await page.goto('/documents');
    await page.getByTestId('library-doc-virtual-scroll').waitFor({ state: 'visible' });
    await assertStatusColumnAlignment(page);

    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'light');
    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'dark');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'light');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'dark');

    await applyDocuvateThemePreference(page, 'light');
    const lightBg = await readDocBodyBackground(page);
    await applyDocuvateThemePreference(page, 'dark');
    const darkBg = await readDocBodyBackground(page);
    expect(lightBg).not.toBe(darkBg);
  });
});
