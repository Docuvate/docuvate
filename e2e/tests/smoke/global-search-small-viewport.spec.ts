// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { globalSearchStoragePath } from '../../helpers/global-search-creds.js';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';

test.use({ storageState: globalSearchStoragePath() });

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
] as const;

test.describe('global search results on small screens', () => {
  for (const viewport of VIEWPORTS) {
    test(`document hits show readable context at ${String(viewport.width)} px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/documents', { waitUntil: 'networkidle' });
      await applyDocuvateLocale(page, 'de');
      await page.goto('/documents', { waitUntil: 'networkidle' });

      await page.keyboard.press('Control+K');
      const input = page.locator('.global-search-palette-input');
      await expect(input).toBeVisible();
      await input.fill('Nordwind');

      const kontoRow = page
        .locator('.global-search-result')
        .filter({ has: page.locator('.global-search-result-title', { hasText: 'Kontoauszug' }) });
      await expect(kontoRow).toHaveCount(1);

      const meta = kontoRow.locator('.global-search-result-meta');
      await expect(meta).toContainText('22. Okt. 2026');
      await expect(meta).toContainText('kontoauszug.pdf');

      const palette = page.locator('.global-search-palette');
      await expect(palette).not.toContainText(/\d{4}-\d{2}-\d{2}T\d{2}:/);

      const rows = page.locator('.global-search-result');
      const rowCount = await rows.count();
      for (let i = 0; i < rowCount; i += 1) {
        const row = rows.nth(i);
        const title = (await row.locator('.global-search-result-title').innerText()).trim();
        const snippets = row.locator('.global-search-snippet');
        if ((await snippets.count()) > 0) {
          expect((await snippets.first().innerText()).trim()).not.toBe(title);
        }
        const box = await row.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        }
      }

      const paletteOverflow = await palette.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(paletteOverflow).toBeLessThanOrEqual(1);
      await assertNoHorizontalOverflow(page);
    });
  }
});
