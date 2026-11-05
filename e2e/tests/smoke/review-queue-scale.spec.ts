// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
/** Small pages force the wizard to load more of the queue while stepping through it. */
const FORCED_PAGE_SIZE = 3;
const QUEUE_LIST = /\/v1\/review-queue(\?|$)/;

async function pendingCount(page: Page): Promise<number> {
  const response = await page.request.get(`${apiBase}/v1/review-queue/summary`);
  expect(response.ok()).toBe(true);
  const body: unknown = await response.json();
  if (typeof body === 'object' && body !== null && 'pendingCount' in body) {
    const count = body.pendingCount;
    if (typeof count === 'number') return count;
  }
  throw new Error('summary has no pendingCount');
}

async function openReview(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto('/review', { waitUntil: 'networkidle' });
  await applyDocuvateLocale(page, 'de');
  await page.reload({ waitUntil: 'networkidle' });
}

test.describe('review queue at scale', () => {
  for (const width of [360, 390]) {
    test(`bulk actions are explained and reachable at ${String(width)} px`, async ({ page }) => {
      const total = await pendingCount(page);
      test.skip(total < 2, 'fixture review queue is empty');
      await openReview(page, width, 780);

      const bulk = page.getByTestId('review-queue-bulk');
      await expect(bulk).toBeVisible();
      await expect(bulk.getByRole('heading')).toContainText(String(total));
      const buttons = bulk.getByRole('button');
      await expect(buttons).toHaveCount(2);
      for (const button of await buttons.all()) {
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
      // The title row no longer carries the bulk actions.
      await expect(page.locator('.review-queue-header').getByRole('button')).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Nächste Seite' })).toHaveCount(0);

      // Bulk accept asks first and says that it covers the whole queue.
      await buttons.first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('nicht nur die angezeigten');
      await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(dialog).toHaveCount(0);

      await assertNoHorizontalOverflow(page);
    });
  }

  test('stepping through the queue loads more without a page button', async ({ page }) => {
    const total = await pendingCount(page);
    test.skip(total <= FORCED_PAGE_SIZE + 2, 'fixture review queue too small');
    await page.route(QUEUE_LIST, async (route) => {
      const url = new URL(route.request().url());
      url.searchParams.set('limit', String(FORCED_PAGE_SIZE));
      await route.continue({ url: url.toString() });
    });
    await openReview(page, 1280, 800);

    await expect(page.getByText(`Dokument 1 von ${String(total)}`)).toBeVisible();
    const steps = FORCED_PAGE_SIZE + 2;
    for (let i = 0; i < steps; i += 1) {
      await page.keyboard.press('ArrowRight');
    }
    await expect(
      page.getByText(`Dokument ${String(steps + 1)} von ${String(total)}`)
    ).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText(`Dokument ${String(steps)} von ${String(total)}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zurück' })).toBeEnabled();
    await assertNoHorizontalOverflow(page);
  });
});
