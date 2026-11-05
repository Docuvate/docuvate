// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const pdfPath = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');
const runId = randomUUID().slice(0, 8);
const ROOT_NAME = `Skalierung Eltern ${runId}`;
const CHILD_NAME = `Skalierung Kind ${runId}`;

function readId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('response has no id');
}

async function createFolder(
  request: APIRequestContext,
  name: string,
  parentId: string | null
): Promise<string> {
  const res = await request.post(`${apiBase}/v1/folders`, { data: { name, parentId } });
  expect(res.ok(), `create folder: ${String(res.status())}`).toBe(true);
  return readId(await res.json());
}

let rootId = '';
let childId = '';
let documentId = '';

test.describe('folder counts include subfolders', () => {
  test.beforeAll(async ({ request }) => {
    rootId = await createFolder(request, ROOT_NAME, null);
    childId = await createFolder(request, CHILD_NAME, rootId);
    const upload = await request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: `skalierung-${runId}.pdf`,
          mimeType: 'application/pdf',
          buffer: fs.readFileSync(pdfPath),
        },
      },
    });
    expect(upload.ok(), `upload: ${String(upload.status())}`).toBe(true);
    documentId = readId(await upload.json());
    const moved = await request.patch(`${apiBase}/v1/documents/${documentId}`, {
      data: { folderId: childId },
    });
    expect(moved.ok(), `move: ${String(moved.status())}`).toBe(true);
  });

  test.afterAll(async ({ request }) => {
    if (documentId) await request.delete(`${apiBase}/v1/documents/${documentId}`);
    if (childId) await request.delete(`${apiBase}/v1/folders/${childId}`);
    if (rootId) await request.delete(`${apiBase}/v1/folders/${rootId}`);
  });

  test('a parent with only subfolders does not read as empty at 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/filesystem', { waitUntil: 'networkidle' });
    await applyDocuvateLocale(page, 'de');

    await page.goto(`/filesystem/folders/${rootId}`, { waitUntil: 'networkidle' });
    const childTile = page.locator('.filesystem-folder-tile', { hasText: CHILD_NAME });
    await expect(childTile).toBeVisible();
    await expect(childTile.locator('.filesystem-folder-tile-count')).toHaveText('1');

    await page.getByRole('textbox', { name: 'Ordnerbaum durchsuchen' }).first().fill(runId);
    const treeRow = page.locator('.dateisystem-tree-virtual-item:visible', { hasText: ROOT_NAME });
    await expect(treeRow.locator('.dateisystem-tree-count')).toHaveText('1');
    await assertNoHorizontalOverflow(page);
  });
});
