// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme.js';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth.js';

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
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'horizontal overflow on page').toBe(false);
}

async function shot(page: Page, fileName: string): Promise<string> {
  await assertNoHorizontalOverflow(page);
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
  test.beforeAll(() => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    const script = path.join(process.cwd(), '..', 'scripts', 'seed-library-perf-fixture.mjs');
    execFileSync('node', [script], {
      cwd: path.join(process.cwd(), '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        LIBRARY_PERF_DOC_COUNT: process.env['LIBRARY_PERF_DOC_COUNT'] ?? '1000',
        LIBRARY_PERF_LABEL_COUNT: process.env['LIBRARY_PERF_LABEL_COUNT'] ?? '300',
      },
    });
  });

  test('captures A3 surfaces at required viewports', async ({ page }) => {
    test.setTimeout(600_000);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await applyDocuvateLocale(page, 'en');

      await page.goto('/');
      await page.locator('[data-ux="page"]').first().waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `dashboard-widgets-${viewport.label}.png`);

      await page.goto('/review');
      await page.locator('.review-queue-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `review-queue-${viewport.label}-initial.png`);

      await page.goto('/documents/duplicates');
      await page.getByTestId('duplicates-overview-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `duplicates-overview-${viewport.label}-initial.png`);
      const dupScroll = page.getByTestId('duplicates-virtual-scroll');
      if (await dupScroll.count()) {
        await scrollVirtualList(page, '[data-testid="duplicates-virtual-scroll"]', 0.45);
        await page.waitForTimeout(300);
        await shot(page, `duplicates-overview-${viewport.label}-scrolled.png`);
        const nextBtn = page.getByRole('button', { name: /next page|nächste seite/i });
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(500);
          await shot(page, `duplicates-overview-${viewport.label}-loading-more.png`);
        } else {
          await scrollVirtualList(page, '[data-testid="duplicates-virtual-scroll"]', 0.95);
          await page.waitForTimeout(400);
          await shot(page, `duplicates-overview-${viewport.label}-scrolled-deep.png`);
        }
      }

      await page.goto('/documents/views');
      await page.locator('.saved-views-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `saved-views-page-${viewport.label}.png`);
      const sidebarViews = page.locator('.sidebar-saved-views');
      if (await sidebarViews.count()) {
        await shot(page, `saved-views-sidebar-${viewport.label}.png`);
      }

      await page.goto('/chat');
      await page.locator('.global-chat-page').waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `global-chat-threads-${viewport.label}-initial.png`);
      const threadScroll = page.locator('.doc-chat-thread-list-scroll');
      if (await threadScroll.count()) {
        await scrollVirtualList(page, '.doc-chat-thread-list-scroll', 0.5);
        await page.waitForTimeout(300);
        await shot(page, `global-chat-threads-${viewport.label}-scrolled.png`);
      }

      await page.goto('/settings/admin/users');
      const adminTable = page.locator('.admin-users-panel');
      try {
        await adminTable.first().waitFor({ state: 'visible', timeout: 15_000 });
        await shot(page, `admin-users-pagination-${viewport.label}.png`);
        const pagination = page.locator('.ui-pagination, [data-testid="ui-pagination"]');
        if (await pagination.count()) {
          await shot(page, `admin-users-pagination-controls-${viewport.label}.png`);
        }
      } catch {
        // smoke user may lack installation admin; skip admin captures
      }

      await page.goto('/structure/labels');
      await page.locator('.labels-todo-panel, .label-rec-panel').first().waitFor({
        state: 'visible',
        timeout: 120_000,
      });
      const reasonText = await page.locator('.labels-todo-suggestion-reason').first().textContent();
      if (reasonText && reasonText.trim().length > 0) {
        expect(reasonText).not.toMatch(/ähnliche Dokumente ohne Label/);
        expect(reasonText).not.toMatch(/Übereinstimmung/);
      }
      await shot(page, `labels-todo-queue-${viewport.label}-initial.png`);
      const todoVirtual = page.getByTestId('labels-todo-virtual-scroll');
      if (await todoVirtual.count()) {
        await scrollVirtualList(page, '[data-testid="labels-todo-virtual-scroll"]', 0.55);
        await page.waitForTimeout(300);
        await shot(page, `labels-todo-queue-${viewport.label}-scrolled.png`);
      }
      const vocabVirtual = page.getByTestId('labels-vocabulary-virtual-scroll');
      if (await vocabVirtual.count()) {
        await scrollVirtualList(page, '[data-testid="labels-vocabulary-virtual-scroll"]', 0.35);
        await page.waitForTimeout(300);
        await shot(page, `labels-vocabulary-table-${viewport.label}-scrolled.png`);
      } else {
        await shot(page, `labels-vocabulary-table-${viewport.label}.png`);
      }

      await page.goto('/filesystem/unassigned');
      await page
        .locator(
          '[data-testid="folder-tree-virtual-scroll"], [data-testid="library-doc-virtual-scroll"], .library-main-card-filesystem'
        )
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      await shot(page, `folder-tree-unassigned-${viewport.label}-initial.png`);
      const treeScroll = page.getByTestId('folder-tree-virtual-scroll');
      if (await treeScroll.count()) {
        await scrollVirtualList(page, '[data-testid="folder-tree-virtual-scroll"]', 0.5);
        await page.waitForTimeout(300);
        await shot(page, `folder-tree-unassigned-${viewport.label}-scrolled.png`);
      }
    }
  });
});
