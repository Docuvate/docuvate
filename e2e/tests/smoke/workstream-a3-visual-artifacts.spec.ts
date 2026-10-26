// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme.js';
import { assertScrollListRowsLayout } from '../../helpers/list-layout-assertions.js';
import { smokeFixtureCredentials, smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth.js';

const artifactRoot =
  process.env['WORKSTREAM_A3_ARTIFACT_DIR'] ?? '/opt/cursor/artifacts/workstream-a3';

const VIEWPORTS = [
  { label: '360', width: 360, height: 740 },
  { label: '390', width: 390, height: 844 },
  { label: '1024', width: 1024, height: 900 },
  { label: '1440', width: 1440, height: 900 },
  { label: '1920', width: 1920, height: 1080 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const scope = document.querySelector('.app-main') ?? document.documentElement;
    return scope.scrollWidth > scope.clientWidth + 4;
  });
  expect(overflow, 'horizontal overflow in main content').toBe(false);
}

async function assertDenseListLayouts(page: Page, viewportWidth: number): Promise<void> {
  const vocabScroll = page.locator('.labels-vocabulary-scroll');
  if (await vocabScroll.count()) {
    const rowSel = viewportWidth <= 640
      ? '.labels-vocabulary-card-row'
      : '.labels-vocabulary-grid--row';
    await assertScrollListRowsLayout(page, '.labels-vocabulary-scroll', rowSel);
  }

  if (viewportWidth <= 640) {
    const adminCards = page.locator('.admin-users-card-list');
    if (await adminCards.count()) {
      await assertScrollListRowsLayout(page, '.admin-users-card-list', '.admin-users-card');
    }
  }
}

async function shot(page: Page, fileName: string, viewportWidth: number): Promise<string> {
  await assertNoHorizontalOverflow(page);
  await assertDenseListLayouts(page, viewportWidth);
  const filePath = path.join(artifactRoot, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function scrollVirtualList(
  page: Page,
  selector: string,
  fraction: number
): Promise<void> {
  await page.evaluate(
    ({ sel, frac }) => {
      const el = document.querySelector(sel);
      if (!el || !(el instanceof HTMLElement)) {
        return;
      }
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = Math.max(0, Math.floor(max * frac));
    },
    { sel: selector, frac: fraction }
  );
}

test.describe('Workstream A3 visual artifacts', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    const script = path.join(process.cwd(), '..', 'scripts', 'seed-library-perf-fixture.mjs');
    const smokeCreds = smokeFixtureCredentials();
    execFileSync('node', [script], {
      cwd: path.join(process.cwd(), '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        E2E_SMOKE_EMAIL: smokeCreds.email,
        LIBRARY_PERF_DOC_COUNT: process.env['LIBRARY_PERF_DOC_COUNT'] ?? '1000',
        LIBRARY_PERF_LABEL_COUNT: process.env['LIBRARY_PERF_LABEL_COUNT'] ?? '300',
        LIBRARY_PERF_REVIEW_PENDING_COUNT: process.env['LIBRARY_PERF_REVIEW_PENDING_COUNT'] ?? '60',
      },
    });
  });

  test.afterAll(() => {
    const files = fs.readdirSync(artifactRoot).filter((name) => name.endsWith('.png'));
    fs.writeFileSync(
      path.join(artifactRoot, 'manifest.json'),
      `${JSON.stringify({ artifactRoot, files: files.sort() }, null, 2)}\n`
    );
  });

  for (const viewport of VIEWPORTS) {
    test(`captures A3 surfaces at ${viewport.label}px`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await applyDocuvateLocale(page, 'en');

      await page.goto('/');
      await page.locator('.dashboard-page').waitFor({ state: 'visible', timeout: 60_000 });
      await page
        .locator('.dashboard-grid, .dashboard-start-skeleton, .dashboard-onboarding')
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `dashboard-widgets-${viewport.label}.png`, viewport.width);

      await page.goto('/review');
      await page.locator('.review-queue-page').waitFor({ state: 'visible', timeout: 60_000 });
      await page.locator('.review-wizard').waitFor({ state: 'visible', timeout: 120_000 });
      await shot(page, `review-queue-${viewport.label}-initial.png`, viewport.width);
      await page.evaluate(() => {
        window.scrollBy(0, Math.min(480, document.documentElement.scrollHeight));
      });
      await page.waitForTimeout(300);
      await shot(page, `review-queue-${viewport.label}-scrolled.png`, viewport.width);
      const reviewLoadMore = page.locator('.review-queue-load-more button');
      if (await reviewLoadMore.isVisible().catch(() => false)) {
        await reviewLoadMore.click();
        await page.waitForTimeout(600);
        await shot(page, `review-queue-${viewport.label}-loading-more.png`, viewport.width);
      }

      await page.goto('/documents/duplicates');
      await page.getByTestId('duplicates-overview-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `duplicates-overview-${viewport.label}-initial.png`, viewport.width);
      const dupScroll = page.getByTestId('duplicates-virtual-scroll');
      if (await dupScroll.count()) {
        await scrollVirtualList(page, '[data-testid="duplicates-virtual-scroll"]', 0.45);
        await page.waitForTimeout(300);
        await shot(page, `duplicates-overview-${viewport.label}-scrolled.png`, viewport.width);
        const nextBtn = page.getByRole('button', { name: /next page|nächste seite/i });
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(500);
          await shot(page, `duplicates-overview-${viewport.label}-loading-more.png`, viewport.width);
        } else {
          await scrollVirtualList(page, '[data-testid="duplicates-virtual-scroll"]', 0.95);
          await page.waitForTimeout(400);
          await shot(page, `duplicates-overview-${viewport.label}-scrolled-deep.png`, viewport.width);
        }
      }

      await page.goto('/documents/views');
      await page.locator('.saved-views-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `saved-views-page-${viewport.label}.png`, viewport.width);
      const sidebarViews = page.locator('.sidebar-saved-views');
      if (await sidebarViews.count()) {
        await shot(page, `saved-views-sidebar-${viewport.label}.png`, viewport.width);
      }

      await page.goto('/chat');
      await page.locator('.global-chat-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `global-chat-threads-${viewport.label}-initial.png`, viewport.width);
      const threadScroll = page.locator('.doc-chat-thread-list-scroll');
      if (await threadScroll.count()) {
        await scrollVirtualList(page, '.doc-chat-thread-list-scroll', 0.5);
        await page.waitForTimeout(300);
        await shot(page, `global-chat-threads-${viewport.label}-scrolled.png`, viewport.width);
      }

      await page.goto('/settings/admin/users');
      const adminTable = page.locator('.admin-users-panel');
      try {
        await adminTable.first().waitFor({ state: 'visible', timeout: 15_000 });
        await shot(page, `admin-users-pagination-${viewport.label}.png`, viewport.width);
        const pagination = page.locator('.ui-pagination, [data-testid="ui-pagination"]');
        if (await pagination.count()) {
          await shot(page, `admin-users-pagination-controls-${viewport.label}.png`, viewport.width);
        }
      } catch {
        // smoke user may lack installation admin; skip admin captures
      }

      await page.goto('/structure/labels');
      await page.locator('.labels-todo-panel, .label-rec-panel').first().waitFor({
        state: 'visible',
        timeout: 120_000,
      });
      const reasonLoc = page.locator('.labels-todo-suggestion-reason');
      if ((await reasonLoc.count()) > 0) {
        const reasonText = (await reasonLoc.first().textContent()) ?? '';
        if (reasonText.trim().length > 0) {
          expect(reasonText).not.toMatch(/ähnliche Dokumente ohne Label/);
          expect(reasonText).not.toMatch(/Übereinstimmung/);
        }
      }
      await shot(page, `labels-todo-queue-${viewport.label}-initial.png`, viewport.width);
      const todoVirtual = page.getByTestId('labels-todo-virtual-scroll');
      if (await todoVirtual.count()) {
        await scrollVirtualList(page, '[data-testid="labels-todo-virtual-scroll"]', 0.55);
        await page.waitForTimeout(300);
        await shot(page, `labels-todo-queue-${viewport.label}-scrolled.png`, viewport.width);
      }
      const vocabScroll = page.locator('.labels-vocabulary-scroll');
      if (await vocabScroll.count()) {
        await scrollVirtualList(page, '.labels-vocabulary-scroll', 0.35);
        await page.waitForTimeout(300);
        await shot(page, `labels-vocabulary-table-${viewport.label}-scrolled.png`, viewport.width);
      } else {
        await shot(page, `labels-vocabulary-table-${viewport.label}.png`, viewport.width);
      }

      await page.goto('/filesystem/unassigned');
      await page
        .locator(
          '[data-testid="folder-tree-virtual-scroll"], [data-testid="library-doc-virtual-scroll"], .library-main-card-filesystem'
        )
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `folder-tree-unassigned-${viewport.label}-initial.png`, viewport.width);
      const treeScroll = page.getByTestId('folder-tree-virtual-scroll');
      if (await treeScroll.count()) {
        await scrollVirtualList(page, '[data-testid="folder-tree-virtual-scroll"]', 0.5);
        await page.waitForTimeout(300);
        await shot(page, `folder-tree-unassigned-${viewport.label}-scrolled.png`, viewport.width);
      }
    });
  }
});
