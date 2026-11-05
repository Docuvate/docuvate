// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

for (const viewport of [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
]) {
  test(`folder tree stays bounded and content is in reach at ${String(viewport.width)} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/filesystem', { waitUntil: 'networkidle' });
    await applyDocuvateLocale(page, 'de');
    await page.reload({ waitUntil: 'networkidle' });

    const treeScroll = page.getByTestId('folder-tree-virtual-scroll').first();
    await expect(treeScroll).toBeVisible();
    const treeBox = await treeScroll.boundingBox();
    expect(treeBox).not.toBeNull();
    expect(treeBox?.height ?? Infinity).toBeLessThanOrEqual(
      Math.min(viewport.height * 0.4, 320) + 1
    );

    const contentPane = page.getByRole('region', { name: 'Ordnerinhalt' });
    const contentBox = await contentPane.boundingBox();
    expect(contentBox?.y ?? Infinity).toBeLessThan(viewport.height);

    await assertNoHorizontalOverflow(page);
  });
}
