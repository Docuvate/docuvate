// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth.js';

const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

test.use({ storageState: smokeFixtureStoragePath() });

test.describe('document field confirmation feedback', () => {
  test('confirming fields shows confirmation banner, not corrections', async ({ page }, testInfo) => {
    const apiBase = process.env['E2E_API_BASE'] ?? 'http://127.0.0.1:3000';
    const pdf = Buffer.concat([
      fs.readFileSync(fixturePdf),
      Buffer.from(`\n%%E2E_FIELD_FEEDBACK=${randomUUID()}\n`, 'utf8'),
    ]);
    const create = await page.request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: 'field-feedback-fixture.pdf',
          mimeType: 'application/pdf',
          buffer: pdf,
        },
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { id: string };

    const patch = await page.request.patch(`${apiBase}/v1/documents/${created.id}`, {
      data: {
        extractionFields: [
          { key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.72 },
          { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 0.71 },
        ],
      },
    });
    expect(patch.ok()).toBeTruthy();

    await page.goto(`/documents/${created.id}?tab=details`);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('.extracted-fields-section')).toBeVisible({ timeout: 90_000 });

    const confirmButtons = page.getByRole('button', { name: /bestätigen|confirm/i });
    const count = await confirmButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i += 1) {
      await confirmButtons.nth(i).click();
    }

    await expect(page.locator('.extracted-fields-save-hint')).toHaveText(/Keine Änderungen|No changes/i);
    const banner = page.locator('.extracted-fields-feedback-banner');
    await expect(banner).toContainText(/Bestätigung|confirmation/i);
    await expect(banner).not.toContainText(/Korrektur|correction/i);

    const screenshot = await page.locator('.extracted-fields-edit-details').screenshot();
    await testInfo.attach('field-feedback-after-confirm.png', {
      body: screenshot,
      contentType: 'image/png',
    });
  });
});
