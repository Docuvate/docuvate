// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const SETTLE_MS = 3_000;

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('labels page network settle', () => {
  for (const locale of ['de', 'en'] as const) {
    test(`structure/labels reaches network idle within ${String(SETTLE_MS)}ms (${locale})`, async ({
      page,
    }) => {
      await page.goto(`${webOrigin}/`);
      await applyDocuvateLocale(page, locale);
      const started = Date.now();
      await page.goto(`${webOrigin}/structure/labels`);
      await page.waitForLoadState('networkidle', { timeout: SETTLE_MS });
      const elapsed = Date.now() - started;
      expect(elapsed).toBeLessThan(SETTLE_MS);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/label|Label/i);
    });
  }
});
