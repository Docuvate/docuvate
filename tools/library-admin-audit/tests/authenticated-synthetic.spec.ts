// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import {
  auditEmail,
  auditPassword,
  syntheticUploadEnabled,
  syntheticWritesEnabled,
  targetReachable,
  webBaseUrl,
} from './support/env';
import { loginWithDocumentedForm } from './support/login';

test.describe('isolated synthetic writes', () => {
  test.beforeAll(async ({ request }) => {
    const up = await targetReachable(request);
    test.skip(!up, `BLOCKED: web target unreachable at ${webBaseUrl()}. Not a mocked pass.`);
    test.skip(
      !auditEmail() || !auditPassword(),
      'BLOCKED: set DOCUVATE_AUDIT_EMAIL and DOCUVATE_AUDIT_PASSWORD. This pack does not scrape sessions.'
    );
  });

  test.beforeEach(async ({ page }) => {
    test.skip(
      !syntheticWritesEnabled(),
      'BLOCKED: set DOCUVATE_AUDIT_SYNTHETIC_WRITES=1 to create one prefixed label on the synthetic account. Read-only navigation does not write.'
    );
    await loginWithDocumentedForm(page);
  });

  test('LIB-027 creates one prefixed label and deletes only that label', async ({ page }) => {
    const name = `lib-audit-${String(Date.now())}`;
    await page.goto('/structure/labels');
    await page.getByRole('button', { name: /new label|neues label/i }).click();
    await page.getByLabel(/^name$/i).fill(name);
    await page.getByRole('button', { name: /create label|label anlegen/i }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    const row = page.locator('tr, li, article').filter({ hasText: name }).first();
    const deleteButton = row.getByRole('button', { name: /delete|löschen/i });
    if ((await deleteButton.count()) !== 1) {
      test.info().annotations.push({
        type: 'cleanup',
        description: `Left synthetic label ${name}. No single delete control was scoped to that row, so nothing else was deleted.`,
      });
      return;
    }
    await deleteButton.click();
    const confirm = page.getByRole('button', { name: /delete|löschen|confirm|bestätigen/i });
    if ((await confirm.count()) > 0) {
      await confirm.last().click();
    }
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('LIB-040 uploads one synthetic PDF only when explicitly enabled', async ({ page }) => {
    test.skip(
      !syntheticUploadEnabled(),
      'BLOCKED: set DOCUVATE_AUDIT_SYNTHETIC_UPLOAD=1 to upload one new synthetic PDF. Default runs do not enqueue extraction or reprocess existing documents.'
    );
    await page.goto('/documents');
    const input = page.locator('input[type="file"][multiple]');
    await expect(input).toHaveCount(1);
    const payload = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 20 100 Td (lib-audit) Tj ET\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
      'utf8'
    );
    await input.setInputFiles({
      name: `lib-audit-${String(Date.now())}.pdf`,
      mimeType: 'application/pdf',
      buffer: payload,
    });
    await expect(page.getByText(/lib-audit-/).first()).toBeVisible({ timeout: 20_000 });
  });
});
