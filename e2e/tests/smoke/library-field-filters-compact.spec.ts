// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import {
  listFields,
  type RecognizedFieldPayload,
  replaceFields,
} from '../../helpers/recognized-fields-catalog';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

const FILTER_FIELD_COUNT = 10;

test.describe('document list field filters at scale', () => {
  const runId = randomUUID().slice(0, 8);
  let originalFields: RecognizedFieldPayload[] | null = null;

  test.beforeAll(async ({ request }) => {
    originalFields = await listFields(request);
    const added: RecognizedFieldPayload[] = Array.from(
      { length: FILTER_FIELD_COUNT },
      (_, index) => ({
        key: `filter_${runId.replace(/-/g, '')}_${String(index)}`,
        label: `Filterfeld ${runId} ${String(index)}`,
        fieldType: 'text',
        sortOrder: 0,
        extractForAllDocuments: true,
        gateLabelIds: [],
        gateLabelMatch: 'any',
        minLabelConfidence: null,
        confidenceGateEnabled: null,
        showInFilter: true,
      })
    );
    await replaceFields(request, [...originalFields, ...added]);
  });

  test.afterAll(async ({ request }) => {
    if (originalFields !== null) await replaceFields(request, originalFields);
  });

  for (const viewport of [
    { width: 360, height: 740 },
    { width: 1280, height: 800 },
  ]) {
    test(`field filters are grouped behind one toggle at ${String(viewport.width)} px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/documents', { waitUntil: 'networkidle' });
      await applyDocuvateLocale(page, 'de');
      await page.reload({ waitUntil: 'networkidle' });

      if (viewport.width < 900) {
        await page.locator('button.library-filter-toggle').click();
      }
      const panel = page.getByTestId('library-filter-panel').locator('visible=true').first();
      await expect(panel).toBeVisible();

      const more = panel.getByTestId('library-filter-more-fields');
      await expect(more).toBeVisible();
      await expect(more.locator('summary')).toContainText(`(${String(FILTER_FIELD_COUNT)})`);
      const firstField = panel.getByText(`Filterfeld ${runId} 0`);
      await expect(firstField).toBeHidden();
      // Labels and status stay reachable without scrolling past every field filter.
      await expect(panel.locator('.filter-group-status')).toBeVisible();

      await more.locator('summary').click();
      await expect(firstField).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
