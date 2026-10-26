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

function isTagSuggestionsBatchResponse(url: string, method: string): boolean {
  if (method !== 'POST') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return /\/v1\/documents\/tag-suggestions$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

interface RequestMetric {
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

  const statusCells = page.locator(
    '.library-table-virtual-body tr.library-table-virtual-row td.library-col-status'
  );
  const count = await statusCells.count();
  const rowsToCheck = Math.min(20, count);
  expect(rowsToCheck).toBeGreaterThan(0);

  for (let i = 0; i < rowsToCheck; i += 1) {
    const box = await statusCells.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box?.x ?? 0) - headerX)).toBeLessThan(1);
  }
}

async function assertDesktopTableLayout(page: import('@playwright/test').Page): Promise<void> {
  const scroll = page.getByTestId('library-doc-virtual-scroll');
  await expect(scroll).toBeVisible();
  const scrollBox = await scroll.boundingBox();
  expect(scrollBox).not.toBeNull();

  const firstRow = page.locator('.library-table-virtual-body tr.library-table-virtual-row').first();
  await expect(firstRow).toBeVisible();
  const rowBox = await firstRow.boundingBox();
  expect(rowBox).not.toBeNull();
  const rowRight = (rowBox?.x ?? 0) + (rowBox?.width ?? 0);
  const containerRight = (scrollBox?.x ?? 0) + (scrollBox?.width ?? 0);
  expect(Math.abs(rowRight - containerRight)).toBeLessThanOrEqual(1);

  const titleCell = firstRow.locator('td.library-col-title').first();
  const titleBox = await titleCell.boundingBox();
  expect(titleBox).not.toBeNull();
  expect((titleBox?.width ?? 0) / (rowBox?.width ?? 1)).toBeGreaterThanOrEqual(0.4);

  const labelOverflow = await page.evaluate(() => {
    const cells = document.querySelectorAll(
      '.library-table-virtual-body tr.library-table-virtual-row td.library-col-labels'
    );
    const limit = Math.min(20, cells.length);
    for (let i = 0; i < limit; i += 1) {
      const cell = cells.item(i);
      if (!(cell instanceof HTMLElement)) {
        continue;
      }
      const chips = cell.querySelectorAll('.chip-label');
      for (let j = 0; j < chips.length; j += 1) {
        const chip = chips.item(j);
        if (!(chip instanceof HTMLElement)) {
          continue;
        }
        const ellipsis = getComputedStyle(chip).textOverflow === 'ellipsis';
        if (chip.scrollWidth > chip.clientWidth && !ellipsis) {
          return true;
        }
      }
      if (cell.scrollWidth > cell.clientWidth + 1) {
        const overflowBtn = cell.querySelector('.document-labels-overflow-btn');
        if (!overflowBtn) {
          return true;
        }
      }
    }
    return false;
  });
  expect(labelOverflow).toBe(false);
}

async function assertMobileStackLayout(page: import('@playwright/test').Page): Promise<void> {
  const scroll = page.getByTestId('library-doc-virtual-scroll');
  await expect(scroll).toBeVisible();
  const scrollBox = await scroll.boundingBox();
  expect(scrollBox).not.toBeNull();
  const firstItem = page.locator('.library-doc-stack-item').first();
  await expect(firstItem).toBeVisible();
  const itemBox = await firstItem.boundingBox();
  expect(itemBox).not.toBeNull();
  const itemRight = (itemBox?.x ?? 0) + (itemBox?.width ?? 0);
  const containerRight = (scrollBox?.x ?? 0) + (scrollBox?.width ?? 0);
  expect(Math.abs(itemRight - containerRight)).toBeLessThanOrEqual(1);
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
    const listRequests: RequestMetric[] = [];
    const tagSuggestionRequests: RequestMetric[] = [];
    let listResponseAtMs: number | null = null;
    let tagSuggestionsResponseAtMs: number | null = null;
    const navigationStarted = Date.now();

    page.on('response', async (res) => {
      const url = res.url();
      const method = res.request().method();
      const timing = res.request().timing();
      const durationMs = timing.responseEnd > 0 ? timing.responseEnd - timing.requestStart : null;
      const body = await res.body().catch(() => new Uint8Array());
      const metric: RequestMetric = {
        url,
        status: res.status(),
        payloadBytes: body.byteLength,
        durationMs,
      };
      if (isDocumentListApiResponse(url, method)) {
        listRequests.push(metric);
        if (listResponseAtMs === null) {
          listResponseAtMs = Date.now() - navigationStarted;
        }
        return;
      }
      if (isTagSuggestionsBatchResponse(url, method)) {
        tagSuggestionRequests.push(metric);
        if (tagSuggestionsResponseAtMs === null) {
          tagSuggestionsResponseAtMs = Date.now() - navigationStarted;
        }
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
    const mobileDomNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);

    expect(listRequests.length).toBe(1);
    expect(listRequests[0]?.url).toContain('limit=50');
    expect(listRequests[0]?.url).not.toContain('includeTagSuggestions=true');
    expect(firstRowMs).toBeLessThan(1000);
    expect(mobileDomNodeCount).toBeLessThan(3000);

    await assertMobileStackLayout(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await applyDocuvateThemePreference(page, 'light');
    await Promise.all([
      page.goto('/documents'),
      page.waitForResponse(
        (res) => isTagSuggestionsBatchResponse(res.url(), res.request().method()),
        { timeout: 15_000 }
      ),
    ]);
    await page.getByTestId('library-doc-virtual-scroll').waitFor({ state: 'visible' });
    await assertStatusColumnAlignment(page);
    await assertDesktopTableLayout(page);

    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'light');
    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'dark');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'light');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'dark');

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
      viewport: { width: 1440, height: 900 },
      firstRowMs,
      listResponseAtMs,
      tagSuggestionsResponseAtMs,
      tagSuggestionRequestCount: tagSuggestionRequests.length,
      tagSuggestionPayloadBytes: tagSuggestionRequests.reduce(
        (sum, entry) => sum + entry.payloadBytes,
        0
      ),
      tagSuggestionRequests,
      domNodeCount: nodeCount,
      listRequestCount: listRequests.length,
      listPayloadBytes: listRequests.reduce((sum, entry) => sum + entry.payloadBytes, 0),
      listRequests,
      navigationTiming,
      notes: {
        tagSuggestions: 'lazy batch POST /documents/tag-suggestions',
        explicitLimit: 50,
      },
    };
    fs.writeFileSync(path.join(artifactRoot, 'perf.json'), `${JSON.stringify(perf, null, 2)}\n`);
    expect(tagSuggestionRequests.length).toBeGreaterThanOrEqual(1);

    await applyDocuvateThemePreference(page, 'light');
    const lightBg = await readDocBodyBackground(page);
    await applyDocuvateThemePreference(page, 'dark');
    const darkBg = await readDocBodyBackground(page);
    expect(lightBg).not.toBe(darkBg);
  });
});
