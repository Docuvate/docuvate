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

const DATE_KEY = 'global:rechnungsdatum';
const NUMBER_KEY = 'global:rechnungsnummer';

test.use({ storageState: smokeFixtureStoragePath() });

interface FieldSnapshot {
  key: string;
  value: string;
  userConfirmed: boolean;
}

function readFieldSnapshots(body: unknown): FieldSnapshot[] {
  if (typeof body !== 'object' || body === null || !('extraction' in body)) {
    return [];
  }
  const extraction = body.extraction;
  if (typeof extraction !== 'object' || extraction === null || !('fields' in extraction)) {
    return [];
  }
  const fields = extraction.fields;
  if (!Array.isArray(fields)) {
    return [];
  }
  const snapshots: FieldSnapshot[] = [];
  for (const field of fields) {
    if (typeof field !== 'object' || field === null) {
      continue;
    }
    const key = 'key' in field && typeof field.key === 'string' ? field.key : undefined;
    const value = 'value' in field && typeof field.value === 'string' ? field.value : '';
    const userConfirmed = 'userConfirmed' in field && field.userConfirmed === true;
    if (key) {
      snapshots.push({ key, value, userConfirmed });
    }
  }
  return snapshots;
}

function readDocumentId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('upload response missing id');
}

/** Upload a synthetic PDF and set two high-confidence model values (not confirmed by a person). */
async function createDocumentWithHighConfidenceFields(request: APIRequestContext): Promise<string> {
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%E2E_FIELD_STATUS=${randomUUID()}\n`, 'utf8'),
  ]);
  const create = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: { name: 'recognized-fields-status.pdf', mimeType: 'application/pdf', buffer: pdf },
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const docId = readDocumentId(await create.json());
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);
  const patch = await request.patch(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
    data: {
      extractionFields: [
        { key: DATE_KEY, value: '15.03.2024', confidence: 0.98 },
        { key: NUMBER_KEY, value: 'RE-2024-0042', confidence: 0.97, userConfirmed: false },
      ],
    },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  return docId;
}

async function readFields(request: APIRequestContext, docId: string): Promise<FieldSnapshot[]> {
  const res = await request.get(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok()).toBeTruthy();
  return readFieldSnapshots(await res.json());
}

async function isFieldConfirmed(
  request: APIRequestContext,
  docId: string,
  key: string
): Promise<boolean> {
  const fields = await readFields(request, docId);
  return fields.find((field) => field.key === key)?.userConfirmed === true;
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

function fieldRow(page: Page, label: RegExp): Locator {
  return page.getByTestId('layout-field-list-found').locator('.field-value-row').filter({
    hasText: label,
  });
}

async function expectSuggested(row: Locator): Promise<void> {
  await expect(row).toBeVisible({ timeout: 60_000 });
  await expect(row.locator('.field-value-row-confirmed')).toHaveCount(0);
}

async function expectConfirmed(row: Locator): Promise<void> {
  await expect(row.locator('.field-value-row-confirmed')).toHaveText(/Bestätigt/);
  await expect(row.getByRole('button', { name: /^Bestätigen$/ })).toHaveCount(0);
}

test.describe('recognized fields: confirmed status needs a person', () => {
  test.describe.configure({ timeout: 360_000 });

  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${apiBase}/v1/documents/${id}`, { headers: { origin: webOrigin } });
    }
  });

  test('desktop: high confidence stays a suggestion until confirmed, and survives reload', async ({
    page,
    request,
  }) => {
    const docId = await createDocumentWithHighConfidenceFields(request);
    createdIds.push(docId);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openOverview(page, docId);

    const date = fieldRow(page, /15\.03\.2024/);
    const number = fieldRow(page, /RE-2024-0042/);
    await expectSuggested(date);
    await expectSuggested(number);
    await expect(page.getByTestId('layout-field-list-found')).not.toContainText('Bestätigt');

    await date.getByRole('button', { name: /^Bestätigen$/ }).click();
    await expect(page.getByText('Feld bestätigt')).toBeVisible();
    await expectConfirmed(date);
    await expectSuggested(number);
    await expect.poll(() => isFieldConfirmed(request, docId, DATE_KEY)).toBe(true);
    expect(await isFieldConfirmed(request, docId, NUMBER_KEY)).toBe(false);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
    await showLayoutPane(page, 'panel');
    await page
      .locator('.layout-side-tabs')
      .getByRole('tab', { name: /Übersicht|Overview/i })
      .click({ force: true });
    await expectConfirmed(fieldRow(page, /15\.03\.2024/));
    await expectSuggested(fieldRow(page, /RE-2024-0042/));
    await assertNoHorizontalOverflow(page);
  });

  for (const width of [390, 375]) {
    test(`${String(width)}px: confirming in the sheet marks only that field as confirmed`, async ({
      page,
      request,
    }) => {
      const docId = await createDocumentWithHighConfidenceFields(request);
      createdIds.push(docId);
      await page.setViewportSize({ width, height: 844 });
      await openOverview(page, docId);

      const date = fieldRow(page, /15\.03\.2024/);
      await expectSuggested(date);
      await assertNoHorizontalOverflow(page);

      await date.getByTestId('field-value-row-select').click();
      const sheet = page.getByTestId('field-correction-sheet');
      await expect(sheet).toBeVisible();
      await sheet.getByRole('button', { name: /^Bestätigen$/ }).click();
      await expect(sheet).toHaveCount(0);
      await expect.poll(() => isFieldConfirmed(request, docId, DATE_KEY)).toBe(true);
      expect(await isFieldConfirmed(request, docId, NUMBER_KEY)).toBe(false);

      await showLayoutPane(page, 'panel');
      await expectConfirmed(fieldRow(page, /15\.03\.2024/));
      await expectSuggested(fieldRow(page, /RE-2024-0042/));
      await assertNoHorizontalOverflow(page);
    });
  }
});
