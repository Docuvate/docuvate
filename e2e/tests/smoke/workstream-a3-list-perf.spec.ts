// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth.js';

const artifactRoot = path.join(process.cwd(), 'test-results', 'workstream-a3-perf');
const MAX_DOM_NODES = 4000;

interface RouteProbe {
  route: string;
  listPathPattern: RegExp;
  readySelector: string;
  /** Page content root (excludes app chrome) for DOM budget checks. */
  domRootSelector: string;
  /** When false, list endpoint may omit cursor `limit` (aggregates / legacy list). */
  expectLimitQueryParam?: boolean;
  /** Optional aggregate endpoint that must be requested (F04). */
  aggregatePathPattern?: RegExp;
}

const ROUTES: RouteProbe[] = [
  {
    route: '/review',
    listPathPattern: /\/v1\/review-queue$/,
    readySelector: '.review-queue-page h1, .review-queue-done-card',
    domRootSelector: '[data-ux="page"]',
  },
  {
    route: '/filesystem/unassigned',
    listPathPattern: /\/v1\/documents$/,
    readySelector:
      '[data-testid="library-doc-virtual-scroll"], [data-testid="library-doc-stack-list"], .library-main-card-filesystem',
    domRootSelector: '[data-ux="page"]',
  },
  {
    route: '/documents/duplicates',
    listPathPattern: /\/v1\/duplicate-sets$/,
    readySelector: '[data-testid="duplicates-overview-page"]',
    domRootSelector: '[data-testid="duplicates-overview-page"]',
  },
  {
    route: '/structure/labels',
    listPathPattern: /\/v1\/labels\/recommendations$/,
    readySelector: '.labels-todo-panel, .label-rec-panel',
    domRootSelector: '[data-ux="page"]',
    expectLimitQueryParam: false,
    aggregatePathPattern: /\/v1\/labels\/document-inventory\/summary$/,
  },
  {
    route: '/chat',
    listPathPattern: /\/v1\/chat\/threads$/,
    readySelector: '.global-chat-page',
    domRootSelector: '[data-ux="page"]',
  },
  {
    route: '/saved-views',
    listPathPattern: /\/v1\/saved-views$/,
    readySelector: '.saved-views-page',
    domRootSelector: '[data-ux="page"]',
  },
];

function urlHasLimitParam(url: string): boolean {
  try {
    return new URL(url).searchParams.has('limit');
  } catch {
    return false;
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index] ?? 0;
}

async function measureRoute(page: Page, probe: RouteProbe): Promise<{
  route: string;
  firstContentMs: number;
  domNodeCount: number;
  listRequestUrls: string[];
  aggregateRequestUrls: string[];
}> {
  const listRequestUrls: string[] = [];
  const aggregateRequestUrls: string[] = [];
  const onRequest = (req: { url: () => string; method: () => string }) => {
    if (req.method() !== 'GET') {
      return;
    }
    try {
      const pathname = new URL(req.url()).pathname;
      if (probe.listPathPattern.test(pathname)) {
        listRequestUrls.push(req.url());
      }
      if (probe.aggregatePathPattern?.test(pathname)) {
        aggregateRequestUrls.push(req.url());
      }
    } catch {
      // ignore malformed URLs
    }
  };

  page.on('request', onRequest);
  const started = Date.now();
  await page.goto(probe.route);
  await page.locator(probe.readySelector).first().waitFor({ state: 'visible', timeout: 60_000 });
  const firstContentMs = Date.now() - started;
  const domNodeCount = await page.evaluate((domRootSelector) => {
    const root = document.querySelector(domRootSelector);
    const scope = root ?? document.querySelector('.app-main') ?? document.body;
    return scope.querySelectorAll('*').length;
  }, probe.domRootSelector);
  page.off('request', onRequest);

  return {
    route: probe.route,
    firstContentMs,
    domNodeCount,
    listRequestUrls,
    aggregateRequestUrls,
  };
}

test.describe('workstream A3 list performance', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    const script = path.join(process.cwd(), '..', 'scripts', 'seed-library-perf-fixture.mjs');
    execFileSync('node', [script], {
      cwd: path.join(process.cwd(), '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        LIBRARY_PERF_DOC_COUNT: process.env['LIBRARY_PERF_DOC_COUNT'] ?? '1000',
      },
    });
  });

  test('list routes stay within DOM and pagination budgets', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const timings: number[] = [];
    const results: Awaited<ReturnType<typeof measureRoute>>[] = [];

    for (const probe of ROUTES) {
      const result = await measureRoute(page, probe);
      results.push(result);
      timings.push(result.firstContentMs);

      expect(result.domNodeCount).toBeLessThan(MAX_DOM_NODES);
      expect(result.listRequestUrls.length).toBeGreaterThan(0);
      if (probe.expectLimitQueryParam ?? true) {
        expect(result.listRequestUrls.some((url) => urlHasLimitParam(url))).toBe(true);
      }
      if (probe.aggregatePathPattern) {
        expect(result.aggregateRequestUrls.length).toBeGreaterThan(0);
      }
    }

    const perf = {
      capturedAt: new Date().toISOString(),
      timingsMs: timings,
      p50Ms: percentile(timings, 0.5),
      p95Ms: percentile(timings, 0.95),
      routes: results,
      maxDomNodes: MAX_DOM_NODES,
      domBudgetScope: 'page-root (data-ux=page or route-specific)',
    };

    fs.writeFileSync(path.join(artifactRoot, 'perf.json'), `${JSON.stringify(perf, null, 2)}\n`);
  });
});
