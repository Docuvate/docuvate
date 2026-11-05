// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { showLayoutPane } from '../../helpers/layout-pane';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { waitForDocumentLayoutIrReady } from '../../helpers/wait-for-layout-ir';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

const NUMBER_KEY = 'global:rechnungsnummer';
const MODEL_VALUE = 'RE-2024-0042';
const CORRECTED_VALUE = 'RE-2024-0043';

test.use({ storageState: smokeFixtureStoragePath() });

interface CorrectionSnapshot {
  documentId: string;
  fieldKey: string;
  oldValue: string;
  newValue: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function readDocumentId(body: unknown): string {
  if (isRecord(body)) {
    const id = readString(body, 'id');
    if (id) return id;
  }
  throw new Error('upload response missing id');
}

function readFieldValue(body: unknown, key: string): string | undefined {
  if (!isRecord(body) || !isRecord(body['extraction'])) return undefined;
  const fields = body['extraction']['fields'];
  if (!Array.isArray(fields)) return undefined;
  for (const field of fields) {
    if (isRecord(field) && readString(field, 'key') === key) {
      return readString(field, 'value');
    }
  }
  return undefined;
}

function readCorrections(body: unknown): CorrectionSnapshot[] {
  if (!isRecord(body) || !Array.isArray(body['items'])) return [];
  const items: CorrectionSnapshot[] = [];
  for (const item of body['items']) {
    if (!isRecord(item)) continue;
    items.push({
      documentId: readString(item, 'documentId'),
      fieldKey: readString(item, 'fieldKey'),
      oldValue: readString(item, 'oldValue'),
      newValue: readString(item, 'newValue'),
    });
  }
  return items;
}

async function createDocumentWithModelValue(request: APIRequestContext): Promise<string> {
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%E2E_FIELD_CONFIRM_CORRECT=${randomUUID()}\n`, 'utf8'),
  ]);
  const create = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: { name: 'field-confirm-correct.pdf', mimeType: 'application/pdf', buffer: pdf },
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const docId = readDocumentId(await create.json());
  // Let extraction finish first so it cannot overwrite the field set below.
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);
  const patch = await request.patch(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
    data: { extractionFields: [{ key: NUMBER_KEY, value: MODEL_VALUE, confidence: 0.62 }] },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  return docId;
}

async function storedValue(request: APIRequestContext, docId: string): Promise<string | undefined> {
  const res = await request.get(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok()).toBeTruthy();
  return readFieldValue(await res.json(), NUMBER_KEY);
}

async function recordedCorrection(
  request: APIRequestContext,
  docId: string
): Promise<CorrectionSnapshot | undefined> {
  const res = await request.get(`${apiBase}/v1/extraction-feedback/field-corrections?limit=50`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok()).toBeTruthy();
  return readCorrections(await res.json()).find(
    (item) => item.documentId === docId && item.fieldKey === NUMBER_KEY
  );
}

async function expectCorrectionRecorded(request: APIRequestContext, docId: string): Promise<void> {
  await expect.poll(() => storedValue(request, docId), { timeout: 30_000 }).toBe(CORRECTED_VALUE);
  await expect
    .poll(() => recordedCorrection(request, docId), { timeout: 30_000 })
    .toEqual({
      documentId: docId,
      fieldKey: NUMBER_KEY,
      oldValue: MODEL_VALUE,
      newValue: CORRECTED_VALUE,
    });
}

async function openOverview(page: Page, docId: string): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
  await showLayoutPane(page, 'panel');
  await page
    .locator('.layout-side-tabs')
    .getByRole('tab', { name: /Übersicht|Overview/i })
    .click({ force: true });
}

function fieldRow(page: Page, value: string): Locator {
  return page
    .getByTestId('layout-field-list-found')
    .locator('.field-value-row')
    .filter({ hasText: value });
}

async function expectConfirmed(row: Locator): Promise<void> {
  await expect(row).toBeVisible({ timeout: 60_000 });
  await expect(row.locator('.field-value-row-confirmed')).toHaveText(/Bestätigt/);
}

test.describe('field confirm / correct happy path', () => {
  test.describe.configure({ timeout: 360_000 });

  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${apiBase}/v1/documents/${id}`, { headers: { origin: webOrigin } });
    }
  });

  test('confirm API: documented body works, a wrong property name is a clear 400', async ({
    request,
  }) => {
    const docId = await createDocumentWithModelValue(request);
    createdIds.push(docId);
    const url = `${apiBase}/v1/documents/${docId}/field-confirmations`;

    const wrong = await request.post(url, {
      headers: { origin: webOrigin },
      data: { key: NUMBER_KEY, value: MODEL_VALUE },
    });
    expect(wrong.status()).toBe(400);
    const problem: unknown = await wrong.json();
    expect(isRecord(problem) ? problem['code'] : undefined).toBe('VALIDATION_FAILED');
    const invalidParams = isRecord(problem) ? problem['invalidParams'] : undefined;
    expect(Array.isArray(invalidParams) ? [...invalidParams].sort() : []).toEqual([
      'fieldKey',
      'key',
    ]);

    const ok = await request.post(url, {
      headers: { origin: webOrigin },
      data: { fieldKey: NUMBER_KEY, value: MODEL_VALUE },
    });
    expect(ok.ok(), await ok.text()).toBeTruthy();
    const body: unknown = await ok.json();
    expect(isRecord(body) && body['confirmed'] === true).toBe(true);
    expect(isRecord(body) ? readString(body, 'fieldKey') : '').toBe(NUMBER_KEY);
  });

  test('desktop: typing a correction saves it, records feedback and survives reload', async ({
    page,
    request,
  }) => {
    const docId = await createDocumentWithModelValue(request);
    createdIds.push(docId);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openOverview(page, docId);

    const row = fieldRow(page, MODEL_VALUE);
    await expect(row).toBeVisible({ timeout: 60_000 });
    await row.getByRole('button', { name: 'Korrigieren' }).click();
    const input = page.getByRole('textbox', { name: /Wert für/ });
    await expect(input).toBeFocused();
    await input.fill(CORRECTED_VALUE);
    await input.press('Enter');

    await expectCorrectionRecorded(request, docId);
    await expectConfirmed(fieldRow(page, CORRECTED_VALUE));
    await expect(fieldRow(page, MODEL_VALUE)).toHaveCount(0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
    await showLayoutPane(page, 'panel');
    await page
      .locator('.layout-side-tabs')
      .getByRole('tab', { name: /Übersicht|Overview/i })
      .click({ force: true });
    await expectConfirmed(fieldRow(page, CORRECTED_VALUE));
    await assertNoHorizontalOverflow(page);
  });

  for (const width of [390, 375]) {
    test(`${String(width)}px: correcting in the sheet saves it and records feedback`, async ({
      page,
      request,
    }) => {
      const docId = await createDocumentWithModelValue(request);
      createdIds.push(docId);
      await page.setViewportSize({ width, height: 844 });
      await openOverview(page, docId);

      const row = fieldRow(page, MODEL_VALUE);
      await expect(row).toBeVisible({ timeout: 60_000 });
      await assertNoHorizontalOverflow(page);
      await row.getByTestId('field-value-row-select').click();
      const sheet = page.getByTestId('field-correction-sheet');
      await expect(sheet).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await sheet.getByRole('textbox').fill(CORRECTED_VALUE);
      await sheet.getByRole('button', { name: 'Speichern' }).click();
      await expect(sheet).toHaveCount(0);

      await expectCorrectionRecorded(request, docId);
      await showLayoutPane(page, 'panel');
      await expectConfirmed(fieldRow(page, CORRECTED_VALUE));
      await assertNoHorizontalOverflow(page);
    });
  }
});
