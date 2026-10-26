// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth.js';

const artifactRoot = path.join(process.cwd(), 'test-results', 'library-list-perf');

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
    const script = path.join(process.cwd(), '..', 'scripts', 'seed-library-perf-fixture.mjs');
    execFileSync('node', [script], {
      cwd: path.join(process.cwd(), '..'),
      stdio: 'inherit',
      env: process.env,
    });
  });

  test('first page loads once with DOM and timing budgets', async ({ page }) => {
    const listRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (req.method() === 'GET' && /\/documents(\?|$)/.test(url) && !url.includes('/documents/')) {
        listRequests.push(url);
      }
    });

    await page.setViewportSize({ width: 390, height: 844 });
    const started = Date.now();
    await page.goto('/documents');
    await page.getByTestId('library-doc-stack-list').or(page.getByTestId('library-doc-virtual-scroll')).first().waitFor({
      state: 'visible',
    });
    await page.locator('.library-doc-stack-item, .library-table-virtualized tbody tr').first().waitFor({
      state: 'visible',
      timeout: 1000,
    });
    const firstRowMs = Date.now() - started;

    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(listRequests.length).toBe(1);
    expect(firstRowMs).toBeLessThan(1000);
    expect(nodeCount).toBeLessThan(3000);

    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'light');
    await captureViewport(page, 'documents', { width: 1440, height: 900 }, 'dark');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'light');
    await captureViewport(page, 'documents', { width: 390, height: 844 }, 'dark');
  });
});
