// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Review screenshots of the structuring screens (dashboard, library, viewer, review queue) in
 * desktop/mobile × light/dark, on synthetic mocks. Output: STRUCTURING_SHOT_DIR
 * (default e2e/test-results/structuring-shots).
 */
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { installStructuringMocks } from './structuringMocks';

const shotDir =
  process.env['STRUCTURING_SHOT_DIR'] ??
  path.join(process.cwd(), 'test-results', 'structuring-shots');

const ROUTES = [
  { slug: 'dashboard', path: '/' },
  { slug: 'library', path: '/documents' },
  { slug: 'viewer', path: '/documents/synthetic-doc-0001' },
  { slug: 'review', path: '/review' },
] as const satisfies readonly { slug: string; path: string }[];

const VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'mobile', width: 390, height: 844 },
] as const satisfies readonly { id: string; width: number; height: number }[];

test.beforeAll(() => {
  fs.mkdirSync(shotDir, { recursive: true });
});

for (const viewport of VIEWPORTS) {
  for (const theme of ['light', 'dark'] as const) {
    for (const route of ROUTES) {
      test(`screenshot ${route.slug} · ${viewport.id} · ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const log = await installStructuringMocks(page, { theme });
        await page.goto(route.path);
        await page.locator('[data-ux="page-title"]').first().waitFor({ state: 'visible' });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        // PDF preview renders asynchronously; give it a beat so the viewer shot is not blank.
        await page.waitForTimeout(1_000);
        await page.screenshot({
          path: path.join(shotDir, `${route.slug}-${viewport.id}-${theme}.png`),
          fullPage: true,
        });
        expect(log.unmatched).toEqual([]);
      });
    }
  }
}
