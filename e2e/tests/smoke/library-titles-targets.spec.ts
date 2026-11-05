// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { collectUndersizedTouchTargetsInPage } from '../helpers/browser-layout-scans';

test.use({ storageState: smokeFixtureStoragePath() });

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const pdfPath = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const runId = randomUUID().slice(0, 8);
const LONG_TITLE = `Nebenkostenabrechnung Mietwohnung Hauptstraße ${runId}`;
const MIN_POINTER_TARGET = 24;

let documentId = '';

function readId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('response has no id');
}

async function openList(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto('/documents', { waitUntil: 'networkidle' });
  await applyDocuvateLocale(page, 'de');
  await page.reload({ waitUntil: 'networkidle' });
}

/** Pointer targets in the list rows, measured with the shared scan at the WCAG 2.5.8 floor. */
async function undersizedListTargets(page: Page, rootSelector: string): Promise<string[]> {
  const root = page.locator(rootSelector).first();
  await expect(root).toBeVisible();
  const violations = await root.evaluate(collectUndersizedTouchTargetsInPage);
  return (
    violations
      .filter((v) => v.width < MIN_POINTER_TARGET - 1 || v.height < MIN_POINTER_TARGET - 1)
      // Inline title links are text links (WCAG 2.5.8 inline exception) with an expanded hit area.
      .filter((v) => !v.descriptor.startsWith('a.library-title-link'))
      .map((v) => `${v.descriptor} ${String(v.width)}x${String(v.height)}`)
  );
}

test.describe('document list titles and pointer targets', () => {
  test.beforeAll(async ({ request }) => {
    const upload = await request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: `titel-${runId}.pdf`,
          mimeType: 'application/pdf',
          buffer: fs.readFileSync(pdfPath),
        },
      },
    });
    expect(upload.ok(), `upload: ${String(upload.status())}`).toBe(true);
    documentId = readId(await upload.json());
    const renamed = await request.patch(`${apiBase}/v1/documents/${documentId}`, {
      data: { title: LONG_TITLE },
    });
    expect(renamed.ok(), `rename: ${String(renamed.status())}`).toBe(true);
  });

  test.afterAll(async ({ request }) => {
    if (documentId) await request.delete(`${apiBase}/v1/documents/${documentId}`);
  });

  for (const width of [1024, 1280]) {
    test(`a long title wraps instead of being cut at ${String(width)} px`, async ({ page }) => {
      await openList(page, width, 800);
      const link = page.locator('.library-table a.library-title-link', { hasText: LONG_TITLE });
      await expect(link).toBeVisible({ timeout: 30_000 });
      const clipped = await link.evaluate(
        (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
      );
      expect(clipped).toBe(false);
      expect(await undersizedListTargets(page, '.library-table')).toEqual([]);
      await assertNoHorizontalOverflow(page);
    });
  }

  test('list rows have no pointer targets below 24 px at 390 px', async ({ page }) => {
    await openList(page, 390, 844);
    await expect(page.locator('.library-doc-stack-list')).toBeVisible({ timeout: 30_000 });
    expect(await undersizedListTargets(page, '.library-page')).toEqual([]);
    await assertNoHorizontalOverflow(page);
  });
});
