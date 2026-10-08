import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { analyzeLayoutConsistency } from '../metrics/layout.js';
import { buildKlmTaskResult } from '../metrics/klm.js';
import { evaluateTargetSize, summarizeTargetFindings } from '../metrics/targets.js';
import { UX_TASK_DEFINITIONS } from './task-definitions.js';
import { measurePageLayout } from './layout-measure.js';
import { scanInteractiveTargets } from './target-scan.js';
import { scanHickDecisionPoints } from './hick-scan.js';
import { runFittsTasksForViewport, type TaskSeed } from './run-tasks.js';
import type { LayoutPageSnapshot, UxMetricsReport, ViewportSpec } from '../metrics/types.js';
import { generateMarkdownReport, generateHtmlReport } from '../report/generate.js';

export interface RunOptions {
  webBase: string;
  email: string;
  password: string;
  seed: TaskSeed;
  /** Machine-readable report dir (json/html; gitignored). */
  outDir: string;
  /** Human markdown report path (committed under baseline/ when refreshing). */
  reportMdPath: string;
  screenshotDir: string;
}

const VIEWPORTS: ViewportSpec[] = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
];

const CUSTOMER_LAYOUT_ROUTES: Array<{
  path: string;
  title: string;
  needsDocumentId?: boolean;
  screenshotSlug?: string;
}> = [
  { path: '/documents', title: 'Dokumente' },
  { path: '/structure/labels', title: 'Labels' },
  { path: '/structure/recognized-fields', title: 'Erkannte Felder' },
  { path: '/filesystem', title: 'Ordner' },
  { path: '/settings', title: 'Einstellungen' },
  {
    path: '/settings/blocked-labels',
    title: 'Einstellungen · Blockierte Labels',
    screenshotSlug: 'settings_blocked_labels',
  },
  {
    path: '/settings/connectors',
    title: 'Einstellungen · Verbindungen',
    screenshotSlug: 'settings_connectors',
  },
  {
    path: '/documents/:id',
    title: 'Dokumentdetail',
    needsDocumentId: true,
    screenshotSlug: 'document-detail',
  },
];

const DEV_LAYOUT_ROUTES = [{ path: '/docs/styles', title: 'Dev · Styles' }];

const TARGET_SCAN_ROUTES = [
  '/documents',
  '/structure/labels',
  '/structure/recognized-fields',
  '/filesystem',
  '/settings',
  '/settings/blocked-labels',
];

function resolveGitSha(): string | null {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function annotateLayoutScreenshot(
  page: import('playwright').Page,
  snapshot: ReturnType<typeof analyzeLayoutConsistency>,
  outPath: string
): Promise<void> {
  const top = snapshot.outliers.slice(0, 6);
  const missing = snapshot.missingLandmarks.slice(0, 4);
  await page.evaluate(
    ({ lines, missingLines }) => {
      const old = document.getElementById('ux-metrics-overlay');
      old?.remove();
      const root = document.createElement('div');
      root.id = 'ux-metrics-overlay';
      root.style.position = 'fixed';
      root.style.top = '12px';
      root.style.right = '12px';
      root.style.zIndex = '99999';
      root.style.background = 'rgba(15, 23, 42, 0.92)';
      root.style.color = '#f8fafc';
      root.style.padding = '12px 14px';
      root.style.font = '12px/1.4 ui-monospace, monospace';
      root.style.maxWidth = '420px';
      root.style.borderRadius = '8px';
      root.style.pointerEvents = 'none';
      const title = document.createElement('div');
      title.textContent = 'Layout consistency (customer pages, 1440px)';
      title.style.fontWeight = '700';
      title.style.marginBottom = '8px';
      root.appendChild(title);
      for (const line of lines) {
        const row = document.createElement('div');
        row.textContent = line;
        row.style.marginBottom = '4px';
        root.appendChild(row);
      }
      if (missingLines.length > 0) {
        const mTitle = document.createElement('div');
        mTitle.textContent = 'Missing landmarks';
        mTitle.style.marginTop = '8px';
        mTitle.style.fontWeight = '600';
        root.appendChild(mTitle);
        for (const line of missingLines) {
          const row = document.createElement('div');
          row.textContent = line;
          row.style.marginBottom = '4px';
          root.appendChild(row);
        }
      }
      document.body.appendChild(root);
      const pageEl = document.querySelector('[data-ux="page"]');
      if (pageEl instanceof HTMLElement) {
        pageEl.style.outline = '2px solid #f97316';
        pageEl.style.outlineOffset = '2px';
      }
      const h1 = document.querySelector('[data-ux="page-title"]');
      if (h1 instanceof HTMLElement) {
        h1.style.outline = '2px dashed #38bdf8';
      }
    },
    {
      lines: top.map((o) => `${o.page} · ${o.metric}=${o.value}px (median ${o.median}px)`),
      missingLines: missing.map((m) => `${m.path}: ${m.missing.join(', ')}`),
    }
  );

  await page.screenshot({ path: outPath, fullPage: false });
}

export async function runUxMetrics(options: RunOptions): Promise<UxMetricsReport> {
  await fs.mkdir(options.outDir, { recursive: true });
  await fs.mkdir(options.screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  context.setDefaultTimeout(60_000);
  const page = await context.newPage();

  const skippedTaskIds = new Set<string>();

  const fittsDesktop = await runFittsTasksForViewport(
    page,
    options.webBase,
    options.email,
    options.password,
    options.seed,
    'desktop',
    1440,
    900,
    skippedTaskIds
  );

  const fittsMobile = await runFittsTasksForViewport(
    page,
    options.webBase,
    options.email,
    options.password,
    options.seed,
    'mobile',
    390,
    844,
    skippedTaskIds
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${options.webBase}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(options.email);
  await page.locator('input[type="password"]').fill(options.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/documents/, { timeout: 60_000 });

  const customerPages: LayoutPageSnapshot[] = [];
  const devPages: LayoutPageSnapshot[] = [];

  async function ensureLoggedIn() {
    await page.goto(`${options.webBase}/documents`, { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      await page.locator('input[type="email"]').fill(options.email);
      await page.locator('input[type="password"]').fill(options.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/documents/, { timeout: 60_000 });
    }
  }

  async function captureLayoutRoutes(
    routes: typeof CUSTOMER_LAYOUT_ROUTES,
    scope: 'customer' | 'dev'
  ) {
    for (const route of routes) {
      const pathName = route.needsDocumentId
        ? `/documents/${options.seed.sampleDocumentId}`
        : route.path;
      await page.goto(`${options.webBase}${pathName}`, { waitUntil: 'networkidle' });
      if (route.needsDocumentId) {
        await page.getByRole('tab', { name: 'Details' }).click({ timeout: 5000 }).catch(() => undefined);
      }
      const snap = await page.evaluate(measurePageLayout, {
        pathname: pathName,
        pageTitle: route.title,
        scope,
      });
      if (scope === 'customer') {
        customerPages.push(snap);
        const shotName =
          route.screenshotSlug ??
          pathName.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
        await page.screenshot({
          path: path.join(options.screenshotDir, `layout-${shotName}-1440.png`),
        });
      } else {
        devPages.push(snap);
      }
    }
  }

  await captureLayoutRoutes(CUSTOMER_LAYOUT_ROUTES, 'customer');
  await captureLayoutRoutes(DEV_LAYOUT_ROUTES, 'dev');

  const layout = analyzeLayoutConsistency(customerPages, devPages);

  await page.goto(`${options.webBase}/documents`, { waitUntil: 'networkidle' });
  await annotateLayoutScreenshot(
    page,
    layout,
    path.join(options.screenshotDir, 'layout-consistency-annotated-1440.png')
  );

  const targetSizes = {
    desktop: [] as ReturnType<typeof evaluateTargetSize>[],
    mobile: [] as ReturnType<typeof evaluateTargetSize>[],
  };

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of TARGET_SCAN_ROUTES) {
    await page.goto(`${options.webBase}${route}`, { waitUntil: 'networkidle' });
    targetSizes.desktop.push(...(await page.evaluate(scanInteractiveTargets)).map(evaluateTargetSize));
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of TARGET_SCAN_ROUTES) {
    await page.goto(`${options.webBase}${route}`, { waitUntil: 'networkidle' });
    targetSizes.mobile.push(...(await page.evaluate(scanInteractiveTargets)).map(evaluateTargetSize));
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await ensureLoggedIn();
  await page.goto(`${options.webBase}/documents`, { waitUntil: 'networkidle' });
  const hick = await page.evaluate(scanHickDecisionPoints);

  await page.evaluate(() => {
    (window as unknown as { __uxCls: number }).__uxCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const ls = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!ls.hadRecentInput && typeof ls.value === 'number') {
          (window as unknown as { __uxCls: number }).__uxCls += ls.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const clsByInteraction: Record<string, number> = {};
  async function measureCls(label: string, action: () => Promise<void>) {
    await ensureLoggedIn();
    await page.evaluate(() => {
      (window as unknown as { __uxCls: number }).__uxCls = 0;
    });
    await action();
    await page.waitForTimeout(400);
    clsByInteraction[label] = await page.evaluate(
      () => (window as unknown as { __uxCls: number }).__uxCls ?? 0
    );
  }

  await measureCls('open-account-menu', async () => {
    await page.locator('.user-account-menu-trigger').click({ timeout: 15_000 });
  });
  await page.keyboard.press('Escape');
  await measureCls('select-document-row', async () => {
    const cb = page.locator('table input[type="checkbox"]').nth(1);
    if (await cb.isVisible().catch(() => false)) {
      await cb.click();
    }
  });
  await measureCls('recognized-fields-dirty', async () => {
    await page.goto(`${options.webBase}/structure/recognized-fields`, { waitUntil: 'networkidle' });
    const checkbox = page
      .locator('.recognized-fields-defaults-card .recognized-field-label-checklist input[type="checkbox"]')
      .first();
    if ((await checkbox.count()) > 0) {
      await checkbox.evaluate((el) => {
        (el as HTMLInputElement).click();
      });
    } else {
      const slider = page.locator('.recognized-fields-defaults-card .confidence-threshold-slider__input').first();
      await slider.evaluate((el) => {
        const input = el as HTMLInputElement;
        const next = (Number.parseFloat(input.value) - 0.03).toFixed(2);
        input.value = next;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });
  await measureCls('save-bar-appears', async () => {
    await page.goto(`${options.webBase}/structure/recognized-fields`, { waitUntil: 'networkidle' });
    const checkbox = page
      .locator('.recognized-fields-defaults-card .recognized-field-label-checklist input[type="checkbox"]')
      .first();
    if ((await checkbox.count()) > 0) {
      await checkbox.evaluate((el) => {
        (el as HTMLInputElement).click();
      });
    } else {
      const slider = page.locator('.recognized-fields-defaults-card .confidence-threshold-slider__input').first();
      await slider.evaluate((el) => {
        const input = el as HTMLInputElement;
        const next = (Number.parseFloat(input.value) - 0.03).toFixed(2);
        input.value = next;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    await page.locator('[data-ux="save-bar"]').waitFor({ state: 'visible', timeout: 10_000 });
  });
  if (!skippedTaskIds.has('search-palette-open-result')) {
    await measureCls('search-palette-opens', async () => {
      await page.goto(`${options.webBase}/documents`, { waitUntil: 'networkidle' });
      await page.keyboard.press('Control+KeyK');
      await page.locator('[data-ux="search-palette"]').waitFor({ state: 'visible', timeout: 10_000 });
    });
  }

  const nestedScrollContainerCount = await page.evaluate(() => {
    return [...document.querySelectorAll('*')].filter((el) => {
      if (!(el instanceof HTMLElement)) {
        return false;
      }
      const style = getComputedStyle(el);
      const scrollable =
        style.overflowY === 'auto' ||
        style.overflowY === 'scroll' ||
        style.overflow === 'auto' ||
        style.overflow === 'scroll';
      return scrollable && el.scrollHeight > el.clientHeight + 2;
    }).length;
  });

  const axeViolationDetails: UxMetricsReport['accessibility']['axeViolations'] = [];
  for (const route of TARGET_SCAN_ROUTES) {
    await page.goto(`${options.webBase}${route}`, { waitUntil: 'networkidle' });
    const axeResults = await new AxeBuilder({ page }).analyze();
    for (const v of axeResults.violations) {
      for (const node of v.nodes) {
        axeViolationDetails.push({
          id: v.id,
          impact: v.impact ?? 'unknown',
          description: v.description,
          route,
          nodeTargets: node.target.map(String),
        });
      }
    }
  }

  const klm = UX_TASK_DEFINITIONS.filter((def) => !skippedTaskIds.has(def.id)).map((def) =>
    buildKlmTaskResult(def.id, def.label, def.klmOperators)
  );

  const report: UxMetricsReport = {
    generatedAt: new Date().toISOString(),
    gitSha: resolveGitSha(),
    webBase: options.webBase,
    seedEmail: options.email,
    viewports: VIEWPORTS,
    skippedFittsTaskIds: [...skippedTaskIds],
    fitts: [...fittsDesktop, ...fittsMobile],
    klm,
    targetSizes,
    layout,
    hick,
    stability: { clsByInteraction, nestedScrollContainerCount },
    accessibility: {
      axeViolationCount: axeViolationDetails.length,
      axeViolations: axeViolationDetails,
      lighthouseAccessibilityScore: null,
      lighthouseNote:
        'Lighthouse skipped in local harness (offline/no Chrome DevTools Protocol audit in this runner).',
    },
  };

  const jsonPath = path.join(options.outDir, 'ux-metrics.json');
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const targetSummary = {
    desktop: summarizeTargetFindings(targetSizes.desktop),
    mobile: summarizeTargetFindings(targetSizes.mobile),
  };

  await fs.writeFile(
    options.reportMdPath,
    generateMarkdownReport(report, targetSummary),
    'utf8'
  );
  await fs.writeFile(
    path.join(options.outDir, 'ux-metrics-report.html'),
    generateHtmlReport(report, targetSummary),
    'utf8'
  );

  await browser.close();
  return report;
}
