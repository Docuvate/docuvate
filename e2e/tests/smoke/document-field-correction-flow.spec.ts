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

const FOUND_KEY = 'global:absender';
const MISSING_KEY = 'global:iban';
const TYPED_IBAN = 'DE89 3704 0044 0532 0130 00';

test.use({ storageState: smokeFixtureStoragePath() });

async function createDocumentWithMissingField(request: APIRequestContext): Promise<string> {
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%E2E_FIELD_CORRECTION=${randomUUID()}\n`, 'utf8'),
  ]);
  const create = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: { name: 'field-correction-flow.pdf', mimeType: 'application/pdf', buffer: pdf },
    },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const created = (await create.json()) as { id: string };
  // Let extraction finish first so it cannot overwrite the fields set below.
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, created.id);
  const patch = await request.patch(`${apiBase}/v1/documents/${created.id}`, {
    headers: { origin: webOrigin },
    data: {
      extractionFields: [
        { key: FOUND_KEY, value: 'Nordwind GmbH', confidence: 0.72 },
        { key: MISSING_KEY, value: '', confidence: 0 },
      ],
    },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  return created.id;
}

async function readFieldValue(
  request: APIRequestContext,
  docId: string,
  key: string
): Promise<string> {
  const res = await request.get(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { extraction?: { fields?: { key: string; value: string }[] } };
  return body.extraction?.fields?.find((field) => field.key === key)?.value ?? '';
}

async function openOverview(page: Page, docId: string): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
  await page
    .locator('.layout-side-tabs')
    .getByRole('tab', { name: /Übersicht|Overview/i })
    .click({ force: true });
}

test.describe('document field correction flow', () => {
  test.describe.configure({ timeout: 360_000 });

  const createdIds: string[] = [];

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${apiBase}/v1/documents/${id}`, { headers: { origin: webOrigin } });
    }
  });

  test('desktop: missing field is honest, typed value saves, marking shows a cancellable hint', async ({
    page,
    request,
  }) => {
    const docId = await createDocumentWithMissingField(request);
    createdIds.push(docId);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openOverview(page, docId);

    const missingList = page.getByTestId('layout-field-list-missing');
    await expect(missingList).toBeVisible({ timeout: 60_000 });
    await expect(missingList).toContainText('Nicht gefunden');
    await expect(missingList.getByRole('button', { name: /^Bestätigen$/ })).toHaveCount(0);
    await expect(page.getByText(/Kein Text im Bereich/)).toHaveCount(0);

    const ibanRow = missingList.locator('.field-value-row').filter({ hasText: /iban/i });
    await ibanRow.getByRole('button', { name: 'Wert eingeben' }).click();
    const input = page.getByRole('textbox', { name: /Wert für/ });
    await expect(input).toBeFocused();
    await input.fill(TYPED_IBAN);
    await input.press('Enter');
    await expect
      .poll(() => readFieldValue(request, docId, MISSING_KEY), { timeout: 30_000 })
      .toBe(TYPED_IBAN);
    await expect(missingList.locator('.field-value-row').filter({ hasText: /iban/i })).toHaveCount(0);
    await expect(page.getByTestId('layout-field-list-found')).toContainText(TYPED_IBAN);
    // Saving a field must not drop the layout IR (regression: unchanged blocks were re-sent).
    await expect(page.locator('.layout-workspace')).toBeVisible();

    const found = page.getByTestId('layout-field-list-found');
    await found.getByRole('button', { name: 'Korrigieren' }).first().click();
    await found.getByRole('button', { name: 'Im Dokument markieren' }).click();
    const hint = page.getByTestId('field-mark-hint');
    await expect(hint).toBeVisible();
    await expect(page.getByRole('radio', { name: /Rechteck|Rectangle/i })).toBeChecked();
    await hint.getByRole('button', { name: 'Markieren abbrechen' }).click();
    await expect(hint).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
  });

  test('390px: sheet saves a typed value for a missing field and offers marking', async ({
    page,
    request,
  }) => {
    const docId = await createDocumentWithMissingField(request);
    createdIds.push(docId);
    await page.setViewportSize({ width: 390, height: 844 });
    await openOverview(page, docId);

    const missingList = page.getByTestId('layout-field-list-missing');
    await expect(missingList).toBeVisible({ timeout: 60_000 });
    await missingList
      .locator('.field-value-row')
      .filter({ hasText: /iban/i })
      .getByTestId('field-value-row-select')
      .click();
    const sheet = page.getByTestId('field-correction-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Nicht gefunden');
    await expect(sheet.getByRole('button', { name: /^Bestätigen$/ })).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: 'Im Dokument markieren' })).toBeVisible();

    await sheet.getByRole('textbox').fill(TYPED_IBAN);
    await sheet.getByRole('button', { name: 'Speichern' }).click();
    await expect(sheet).toHaveCount(0);
    await expect
      .poll(() => readFieldValue(request, docId, MISSING_KEY), { timeout: 30_000 })
      .toBe(TYPED_IBAN);
    await assertNoHorizontalOverflow(page);
  });
});
