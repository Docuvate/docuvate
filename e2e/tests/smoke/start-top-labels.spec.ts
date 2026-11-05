// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

/** Start shows the most used label names in full instead of cutting them at a fixed column. */
for (const width of [360, 390, 1280]) {
  test(`Start top labels are not truncated at ${String(width)} px`, async ({ page }) => {
    await applyDocuvateLocale(page, 'de');
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const labels = page.locator('.dashboard-top-label-chip .chip-label');
    await expect(labels.first()).toBeVisible();
    const clipped = await labels.evaluateAll((nodes) =>
      nodes
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => node.textContent ?? '')
    );
    expect(clipped).toEqual([]);
    await assertNoHorizontalOverflow(page);
  });
}
