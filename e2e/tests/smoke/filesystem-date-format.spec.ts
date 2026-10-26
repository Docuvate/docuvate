// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const ISO_IN_CELL = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('filesystem metadata dates', () => {
  for (const locale of ['de', 'en'] as const) {
    test(`does not show raw ISO timestamps in date cells (${locale})`, async ({ page }) => {
      await page.goto('/');
      await applyDocuvateLocale(page, locale);
      await page.goto('/filesystem');
      await page.getByTestId('library-doc-virtual-scroll').waitFor({ state: 'visible', timeout: 60_000 });
      const dateCells = page.locator('td.library-col-date');
      const count = Math.min(await dateCells.count(), 12);
      for (let i = 0; i < count; i += 1) {
        const text = (await dateCells.nth(i).innerText()).trim();
        expect(text).not.toMatch(ISO_IN_CELL);
      }
    });
  }
});
