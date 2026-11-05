// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { collectUndersizedTouchTargetsInPage } from '../helpers/browser-layout-scans';

test.use({ storageState: smokeFixtureStoragePath() });

const MIN_POINTER_TARGET = 24;

/** Labels and Ordner keep every pointer target at least 24 px (WCAG 2.5.8) on a phone. */
for (const route of ['/structure/labels', '/filesystem']) {
  test(`${route} has no pointer targets below 24 px at 390 px`, async ({ page }) => {
    await applyDocuvateLocale(page, 'de');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator('main').first()).toBeVisible();

    const violations = await page.locator('body').evaluate(collectUndersizedTouchTargetsInPage);
    const undersized = violations
      .filter((v) => v.width < MIN_POINTER_TARGET - 1 || v.height < MIN_POINTER_TARGET - 1)
      .map((v) => `${v.descriptor} ${String(v.width)}x${String(v.height)}`);
    expect(undersized).toEqual([]);
    await assertNoHorizontalOverflow(page);
  });
}
