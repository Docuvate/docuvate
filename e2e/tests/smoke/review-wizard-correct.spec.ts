// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { waitForDocumentLayoutIrReady } from '../../helpers/wait-for-layout-ir';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

const SUGGESTED_VALUE = 'Muster Handels GmbH';
const CORRECTED_VALUE = 'Beispiel Lieferant AG';
const QUEUE_CONTAINERS = ['.review-queue-page', '.review-next-card'];
const WORKBENCH_CONTAINERS = ['.document-detail-page', '.review-workbench'];

test.use({ storageState: smokeFixtureStoragePath() });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function readFields(body: unknown): { key: string; value: string }[] {
  if (!isRecord(body) || !isRecord(body['extraction'])) return [];
  const fields = body['extraction']['fields'];
  if (!Array.isArray(fields)) return [];
  const rows: { key: string; value: string }[] = [];
  for (const field of fields) {
    if (isRecord(field)) rows.push({ key: readString(field, 'key'), value: readString(field, 'value') });
  }
  return rows;
}

function queuedItem(body: unknown, docId: string): Record<string, unknown> | undefined {
  if (!isRecord(body) || !Array.isArray(body['items'])) return undefined;
  for (const item of body['items']) {
    if (isRecord(item) && readString(item, 'documentId') === docId) return item;
  }
  return undefined;
}

async function createDocumentWithSuggestion(
  request: APIRequestContext,
  title: string
): Promise<string> {
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%E2E_REVIEW_WIZARD_CORRECT=${randomUUID()}\n`, 'utf8'),
  ]);
  const create = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: { name: 'review-wizard-correct.pdf', mimeType: 'application/pdf', buffer: pdf },
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const body: unknown = await create.json();
  const docId = isRecord(body) ? readString(body, 'id') : '';
  expect(docId).not.toBe('');
  // Let extraction finish first so it cannot overwrite the suggestion set below.
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);
  const patch = await request.patch(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
    data: {
      title,
      extractionFields: [{ key: 'suggestion:vendor', value: SUGGESTED_VALUE, confidence: 0.9 }],
    },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  return docId;
}

async function storedFields(
  request: APIRequestContext,
  docId: string
): Promise<{ key: string; value: string }[]> {
  const res = await request.get(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok()).toBeTruthy();
  return readFields(await res.json());
}

async function queuedFieldSuggestionValues(
  request: APIRequestContext,
  docId: string
): Promise<string[] | null> {
  const res = await request.get(`${apiBase}/v1/review-queue?limit=100`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok()).toBeTruthy();
  const item = queuedItem(await res.json(), docId);
  if (!item) return [];
  const suggestions = item['fieldSuggestions'];
  if (!Array.isArray(suggestions)) return null;
  const values: string[] = [];
  for (const suggestion of suggestions) {
    if (isRecord(suggestion)) values.push(readString(suggestion, 'value'));
  }
  return values;
}

async function openSuggestionInWorkbench(page: Page, docId: string): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/review', { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
  await expect(page.getByTestId('review-next-work')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.review-wizard')).toHaveCount(0);
  const openReview = page.locator(
    `a[data-testid="review-open-structuring"][href*="${docId}"]`
  );
  const itemLink = page.locator(`a.review-next-item-link[href*="${docId}"]`);
  await expect(openReview).toBeVisible({ timeout: 60_000 });
  await expect(itemLink).toBeVisible({ timeout: 60_000 });
  await assertNoHorizontalOverflow(page, QUEUE_CONTAINERS);
  await openReview.click();
  await expect(page).toHaveURL(new RegExp(`/documents/${docId}\\?review=1`));
  await expect(page.locator('.review-workbench-row', { hasText: SUGGESTED_VALUE })).toBeVisible({
    timeout: 60_000,
  });
}

test.describe('review wizard field correction', () => {
  test.describe.configure({ timeout: 360_000 });

  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${apiBase}/v1/documents/${id}`, { headers: { origin: webOrigin } });
    }
  });

  for (const width of [390, 375]) {
    test(`${width}px: correcting a suggestion saves it and clears it from the queue`, async ({
      page,
      request,
    }) => {
      const title = `E2E Wizard Korrektur ${width} ${randomUUID().slice(0, 8)}`;
      const docId = await createDocumentWithSuggestion(request, title);
      createdIds.push(docId);
      await expect
        .poll(() => queuedFieldSuggestionValues(request, docId), { timeout: 30_000 })
        .toEqual([SUGGESTED_VALUE]);

      await page.setViewportSize({ width, height: 812 });
      await openSuggestionInWorkbench(page, docId);
      const row = page.locator('.review-workbench-row', { hasText: SUGGESTED_VALUE });
      await assertNoHorizontalOverflow(page, WORKBENCH_CONTAINERS);

      await row.getByRole('button', { name: /korrigieren/i }).click();
      const input = page.getByRole('textbox', { name: /Neuer Wert für/ });
      await expect(input).toHaveValue(SUGGESTED_VALUE);
      await input.fill(CORRECTED_VALUE);
      await assertNoHorizontalOverflow(page, WORKBENCH_CONTAINERS);
      await row.getByRole('button', { name: 'Speichern', exact: true }).click();

      await expect
        .poll(async () => (await storedFields(request, docId)).find((f) => f.key === 'vendor')?.value, {
          timeout: 30_000,
        })
        .toBe(CORRECTED_VALUE);
      const fields = await storedFields(request, docId);
      expect(fields.some((f) => f.key === 'suggestion:vendor')).toBe(false);
      // The document may stay queued for other reasons (e.g. a duplicate stack), but the
      // corrected field must not come back as a suggestion.
      await expect
        .poll(() => queuedFieldSuggestionValues(request, docId), { timeout: 30_000 })
        .toEqual([]);
      await expect(
        page.locator('.review-workbench-row[data-row-state="suggested"]', { hasText: SUGGESTED_VALUE })
      ).toHaveCount(0);
      await assertNoHorizontalOverflow(page, WORKBENCH_CONTAINERS);
    });
  }
});
