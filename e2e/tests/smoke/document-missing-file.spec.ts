// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const pdfPath = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

let documentId = '';

function readId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('response has no id');
}

/**
 * A ready document whose original file cannot be loaded and that has no text: the retry is a
 * quiet secondary action with an explanation, not a large primary button.
 */
test.describe('document without a file', () => {
  test.beforeAll(async ({ request }) => {
    const upload = await request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: 'ohne-datei.pdf',
          mimeType: 'application/pdf',
          buffer: fs.readFileSync(pdfPath),
        },
      },
    });
    expect(upload.ok(), `upload: ${String(upload.status())}`).toBe(true);
    documentId = readId(await upload.json());
  });

  test.afterAll(async ({ request }) => {
    if (documentId) await request.delete(`${apiBase}/v1/documents/${documentId}`);
  });

  for (const width of [390, 1280]) {
    test(`retry is secondary when the file is missing at ${String(width)} px`, async ({ page }) => {
      const documentUrl = new RegExp(`/v1/documents/${documentId}(\\?.*)?$`);
      await page.route(documentUrl, async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        const response = await route.fetch();
        const body: unknown = await response.json();
        const doc = typeof body === 'object' && body !== null ? body : {};
        await route.fulfill({
          response,
          json: { ...doc, status: 'ready', extraction: { text: '', blocks: [] } },
        });
      });
      await page.route(new RegExp(`/v1/documents/${documentId}/(preview|content)`), (route) =>
        route.fulfill({ status: 404, body: '' })
      );

      await page.setViewportSize({ width, height: 844 });
      await applyDocuvateLocale(page, 'de');
      await page.goto(`/documents/${documentId}`, { waitUntil: 'networkidle' });

      const empty = page.locator('.extraction-empty-ready');
      await expect(empty).toContainText('Originaldatei ist nicht verfügbar');
      const retry = empty.getByRole('button', { name: 'Text erneut erkennen' });
      await expect(retry).toBeVisible();
      await expect(retry).toHaveClass(/btn-ghost/);
      await assertNoHorizontalOverflow(page);
    });
  }
});
