// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import {
  assertLayoutIrReadable,
  openRotatedDocumentPage,
  uploadRotatedDocument,
} from '../../helpers/rotated-document-fixture';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3000';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://127.0.0.1:5173';

test.describe('UC4 page rotation', () => {
  test.use({ storageState: smokeFixtureStoragePath() });

  for (const rotationDeg of [90, 180] as const) {
    test(`rotated ${String(rotationDeg)}° fixture extracts readable layout IR`, async ({
      request,
      page,
    }) => {
      const docId = await uploadRotatedDocument(request, apiBase, webOrigin, rotationDeg);
      await assertLayoutIrReadable(request, apiBase, webOrigin, docId);

      await openRotatedDocumentPage(page, docId);
      await expect(page.locator('.pdf-page-canvas, .pdf-viewer').first()).toBeVisible({
        timeout: 180_000,
      });

      const rotateBtn = page.getByTestId('pdf-viewer-rotate-clockwise');
      await expect(rotateBtn).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute(
        'data-rotation-deg',
        '0'
      );
      await rotateBtn.click();
      await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute(
        'data-rotation-deg',
        '90'
      );
      await rotateBtn.click();
      await expect(page.getByTestId('pdf-viewer-display-rotation')).toHaveAttribute(
        'data-rotation-deg',
        '180'
      );
    });
  }
});
