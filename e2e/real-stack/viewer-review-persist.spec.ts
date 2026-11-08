// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import { dragAcrossText, dragOnPdfPage } from '../support/dragOnPage';

const apiBase = (process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3001').replace(/\/$/, '');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

function readArray(record: Record<string, unknown>, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

async function apiGet(page: Page, pathName: string): Promise<Record<string, unknown>> {
  const text = await page.evaluate(async (url) => {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`${response.status} ${url}`);
    }
    return response.text();
  }, `${apiBase}${pathName}`);
  const payload: unknown = JSON.parse(text);
  if (!isRecord(payload)) {
    throw new Error(`API ${pathName} did not return an object`);
  }
  return payload;
}

function assertUuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`document id is not a uuid: ${value}`);
  }
  return value;
}

function extractionCorpus(detail: Record<string, unknown>): string {
  const extraction = detail['extraction'];
  if (!isRecord(extraction)) return '';
  const parts: string[] = [];
  const text = readString(extraction, 'text');
  if (text) parts.push(text);
  for (const block of readArray(extraction, 'blocks')) {
    if (!isRecord(block)) continue;
    const blockText = readString(block, 'text');
    if (blockText) parts.push(blockText);
  }
  return parts.join('\n');
}

function suggestionFieldKeys(detail: Record<string, unknown>): string[] {
  const extraction = detail['extraction'];
  if (!isRecord(extraction)) return [];
  const keys: string[] = [];
  for (const field of readArray(extraction, 'fields')) {
    if (!isRecord(field)) continue;
    const key = readString(field, 'key');
    if (key?.startsWith('suggestion:')) keys.push(key);
  }
  return keys;
}

function seedSuggestion(documentId: string): void {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error(
      'No review row after extraction and DATABASE_URL is unset, so a suggestion cannot be seeded'
    );
  }
  const id = assertUuid(documentId);
  const sql = `INSERT INTO document_field_values (
      document_id, field_storage_key, value_text, confidence, user_confirmed, value_text_norm
    ) VALUES (
      '${id}', 'suggestion:vendor', 'ACME GmbH', 0.55, false, 'acme gmbh'
    )
    ON CONFLICT (document_id, field_storage_key) DO UPDATE SET
      value_text = EXCLUDED.value_text,
      confidence = EXCLUDED.confidence,
      user_confirmed = false,
      value_text_norm = EXCLUDED.value_text_norm`;
  execFileSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' });
}

async function uploadPdf(page: Page): Promise<string> {
  const doc = await PDFDocument.create();
  const pdfPage = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  pdfPage.drawText('NORTH 1842', { x: 72, y: 720, size: 18, font });
  pdfPage.drawText('INVOICE TOTAL', { x: 72, y: 680, size: 18, font });
  const bytes = await doc.save();
  const dir = mkdtempSync(path.join(tmpdir(), 'viewer-review-'));
  const file = path.join(dir, 'invoice.pdf');
  writeFileSync(file, bytes);
  await page.locator('input[type="file"]').first().setInputFiles(file);
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const listed = await apiGet(page, '/v1/documents?limit=5');
    for (const item of readArray(listed, 'items')) {
      if (!isRecord(item)) continue;
      const id = readString(item, 'id');
      const status = readString(item, 'status');
      if (!id) continue;
      if (status === 'failed') {
        throw new Error(`document ${id} failed extraction`);
      }
      if (status === 'ready') return id;
    }
    await page.waitForTimeout(2_000);
  }
  throw new Error('document did not become ready');
}

test.describe.configure({ mode: 'serial' });

test('reject, undo, rotated bbox, and table overlay persist through the API', async ({ page, request }) => {
  const health = await request.get(`${apiBase}/health`);
  expect(health.ok(), 'API /health').toBeTruthy();

  const email = `viewer-audit-${String(Date.now())}@example.com`;
  await page.goto('/register');
  await page.locator('input[autocomplete="name"]').fill('Viewer Audit');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('viewer-audit-40cd');
  await page.locator('form.auth-form button[type="submit"]').click();
  await page.waitForURL('**/documents**');

  const documentId = await uploadPdf(page);
  const extracted = await apiGet(page, `/v1/documents/${documentId}`);
  const corpus = extractionCorpus(extracted);
  expect(corpus).toContain('NORTH 1842');
  expect(corpus).toContain('INVOICE TOTAL');
  expect(suggestionFieldKeys(extracted)).toEqual([]);

  await page.goto(`/documents/${documentId}`);
  const reject = page.getByTestId('review-workbench-reject');
  if ((await reject.count()) === 0) {
    seedSuggestion(documentId);
    await page.reload();
  }
  await expect(reject.first()).toBeVisible();

  const pendingBefore = readNumber(await apiGet(page, '/v1/review-queue/summary'), 'pendingCount');
  expect(pendingBefore).not.toBeNull();
  await reject.first().click();
  await expect(page.getByTestId('review-workbench-rejected')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('review-workbench-rejected')).toBeVisible();
  const rejected = await apiGet(page, `/v1/documents/${documentId}/field-suggestion-decisions`);
  expect(readArray(rejected, 'items').length).toBeGreaterThan(0);
  const pendingAfterReject = readNumber(await apiGet(page, '/v1/review-queue/summary'), 'pendingCount');
  expect(pendingAfterReject).toBeLessThan(pendingBefore ?? 0);

  await page.getByTestId('review-workbench-undo-reject').click();
  await page.reload();
  await expect(page.getByTestId('review-workbench-rejected')).toHaveCount(0);
  const restored = await apiGet(page, `/v1/documents/${documentId}/field-suggestion-decisions`);
  expect(readArray(restored, 'items')).toEqual([]);
  const pendingAfterUndo = readNumber(await apiGet(page, '/v1/review-queue/summary'), 'pendingCount');
  expect(pendingAfterUndo).toBe(pendingBefore);

  const before = await apiGet(page, `/v1/documents/${documentId}/page-transforms`);
  const beforeTurns = readArray(before, 'transforms')
    .filter(isRecord)
    .map((row) => readNumber(row, 'rotationQuarterTurns'))
    .find((turns) => turns != null) ?? 0;
  await page.locator('.pdf-page-wrap').first().waitFor({ state: 'visible' });
  const saved = page.waitForResponse(
    (response) => response.url().includes('/transform') && response.request().method() === 'POST' && response.ok()
  );
  await page.getByTestId('pdf-viewer-rotate-clockwise').first().click();
  await saved;
  await page.reload();
  const after = await apiGet(page, `/v1/documents/${documentId}/page-transforms`);
  const afterTurns = readArray(after, 'transforms')
    .filter(isRecord)
    .map((row) => readNumber(row, 'rotationQuarterTurns'));
  expect(afterTurns).toContain((beforeTurns + 1) % 4);

  const workbench = page.locator('.review-workbench');
  await workbench.getByRole('button', { name: /korrigieren|correct/i }).click();
  await expect(page.getByTestId('field-position-correct')).toBeVisible();
  await page.getByTestId('field-position-correct').click();
  await expect(page.getByRole('radio', { name: /Bereich|Area/ })).toBeChecked();
  await dragOnPdfPage(page, 0.2, 0.2, 0.55, 0.45);
  await expect(page.getByTestId('field-context-bar')).toBeVisible();
  const correction = page.waitForResponse(
    (response) => response.url().includes('/corrections') && response.request().method() === 'POST' && response.ok()
  );
  await page.getByTestId('field-context-bar-accept').click();
  await correction;
  await page.reload();
  const fields = await apiGet(page, `/v1/documents/${documentId}/regions?role=field`);
  const fieldItems = readArray(fields, 'items').filter(isRecord);
  expect(fieldItems.length).toBeGreaterThan(0);
  const field = fieldItems[0];
  if (!field) throw new Error('field region missing');
  const x0 = readNumber(field, 'x0');
  const x1 = readNumber(field, 'x1');
  const y0 = readNumber(field, 'y0');
  const y1 = readNumber(field, 'y1');
  expect(x0).not.toBeNull();
  expect(y0).not.toBeNull();
  expect(x1).toBeGreaterThan(x0 ?? 0);
  expect(y1).toBeGreaterThan(y0 ?? 0);

  const layout = page.getByTestId('structuring-primary-layout');
  await expect(layout).toBeVisible();
  await layout.click();
  await expect(layout).toHaveAttribute('aria-pressed', 'true');
  const area = page.getByRole('radio', { name: /Bereich|Area/ });
  await area.click();
  await expect(area).toBeChecked();
  const invoice = page.locator('.pdf-page-wrap .textLayer span', { hasText: /INVOICE/ }).first();
  await expect(invoice).toBeVisible();
  await dragAcrossText(page, invoice);
  const markTable = page.getByTestId('selection-mark-table');
  await expect(markTable).toBeVisible();
  const created = page.waitForResponse(
    (response) =>
      response.url().includes('/table-corrections') && response.request().method() === 'POST' && response.ok()
  );
  await markTable.click();
  await created;
  await page.getByTestId('table-edit-in-document').click();
  const bounds = page.waitForResponse(
    (response) =>
      response.url().includes('/table-corrections') && response.request().method() === 'POST' && response.ok()
  );
  await page.getByTestId('table-overlay-save-bounds').click();
  await bounds;
  await page.reload();
  const tables = await apiGet(page, `/v1/documents/${documentId}/regions?role=table`);
  expect(readArray(tables, 'items').length).toBeGreaterThan(0);
});
