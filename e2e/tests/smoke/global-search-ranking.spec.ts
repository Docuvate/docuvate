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
const PALETTE_CONTAINERS = ['.global-search-palette-input-row', '.global-search-results'];

test.use({ storageState: smokeFixtureStoragePath() });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function documentHitIds(body: unknown): string[] {
  if (!isRecord(body) || !Array.isArray(body['groups'])) return [];
  for (const group of body['groups']) {
    if (!isRecord(group) || readString(group, 'type') !== 'documents') continue;
    const items = group['items'];
    if (!Array.isArray(items)) return [];
    const ids: string[] = [];
    for (const item of items) {
      if (isRecord(item)) ids.push(readString(item, 'id'));
    }
    return ids;
  }
  return [];
}

interface FixtureDocument {
  title: string;
  filename: string;
  vendor?: string;
}

async function createDocument(request: APIRequestContext, doc: FixtureDocument): Promise<string> {
  const pdf = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%E2E_SEARCH_RANKING=${randomUUID()}\n`, 'utf8'),
  ]);
  const create = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: { file: { name: doc.filename, mimeType: 'application/pdf', buffer: pdf } },
  });
  expect(create.ok(), await create.text()).toBeTruthy();
  const body: unknown = await create.json();
  const docId = isRecord(body) ? readString(body, 'id') : '';
  expect(docId).not.toBe('');
  // Let extraction finish first so it cannot overwrite the title and fields set below.
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);
  const patch = await request.patch(`${apiBase}/v1/documents/${docId}`, {
    headers: { origin: webOrigin },
    data: {
      title: doc.title,
      ...(doc.vendor
        ? { extractionFields: [{ key: 'global:absender', value: doc.vendor, confidence: 1 }] }
        : {}),
    },
  });
  expect(patch.ok(), await patch.text()).toBeTruthy();
  return docId;
}

async function searchDocumentIds(request: APIRequestContext, q: string): Promise<string[]> {
  const res = await request.get(`${apiBase}/v1/search`, {
    headers: { origin: webOrigin },
    params: { q, types: 'documents', limit: 10 },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return documentHitIds(await res.json());
}

async function searchInPalette(page: Page, q: string): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/documents', { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
  // Wide layouts show the search field trigger, narrow ones the icon button.
  await page.locator('.global-search-trigger:visible, .global-search-mobile-trigger:visible').click();
  const input = page.locator('.global-search-palette-input');
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(q);
}

test.describe('global search ranking', () => {
  test.describe.configure({ mode: 'serial', timeout: 360_000 });

  // A unique word keeps the fixture independent of other documents of the smoke user.
  const marker = `Rangprobe${randomUUID().slice(0, 8)}`;
  const query = `${marker} Jahresabrechnung`;
  const exactTitle = query;
  const createdIds: string[] = [];
  let exactId = '';

  test.beforeAll(async ({ request }) => {
    // Two distractors repeat the query in title, filename and a field value, so they win every
    // other lexical leg. Only the exact-title leg puts the target first.
    exactId = await createDocument(request, {
      title: exactTitle,
      filename: 'ranking-fixture.pdf',
    });
    createdIds.push(exactId);
    createdIds.push(
      await createDocument(request, {
        title: `${query} Nachtrag ${query}`,
        filename: `${query} Nachtrag.pdf`,
        vendor: query,
      })
    );
    createdIds.push(
      await createDocument(request, {
        title: `Kopie ${query} ${query} Entwurf`,
        filename: `Kopie ${query}.pdf`,
        vendor: query,
      })
    );
  });

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${apiBase}/v1/documents/${id}`, { headers: { origin: webOrigin } });
    }
  });

  test('API: the document whose title equals the query ranks first', async ({ request }) => {
    await expect
      .poll(
        async () =>
          (await searchDocumentIds(request, query)).filter((id) => createdIds.includes(id)).length,
        {
          timeout: 60_000,
        }
      )
      .toBe(createdIds.length);
    const ids = await searchDocumentIds(request, query);
    expect(ids[0]).toBe(exactId);
    // Case does not matter for an exact title match.
    expect((await searchDocumentIds(request, query.toLowerCase()))[0]).toBe(exactId);
  });

  test('desktop: the palette lists the exact title first', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await searchInPalette(page, query);
    const firstDocument = page
      .locator('.global-search-group')
      .filter({ has: page.locator('.global-search-group-title', { hasText: 'Dokumente' }) })
      .locator('[data-ux="search-result"] .global-search-result-title')
      .first();
    await expect(firstDocument).toHaveText(exactTitle, { timeout: 30_000 });
  });

  for (const width of [390, 375]) {
    test(`${width}px: the palette lists the exact title first without overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await searchInPalette(page, query);
      const firstDocument = page
        .locator('.global-search-group')
        .filter({ has: page.locator('.global-search-group-title', { hasText: 'Dokumente' }) })
        .locator('[data-ux="search-result"] .global-search-result-title')
        .first();
      await expect(firstDocument).toHaveText(exactTitle, { timeout: 30_000 });
      await assertNoHorizontalOverflow(page, PALETTE_CONTAINERS);
    });
  }
});
