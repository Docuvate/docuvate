// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

test.use({ storageState: smokeFixtureStoragePath() });

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const runId = randomUUID().slice(0, 8);
const ROOT_NAME = `Verträge ${runId}`;
const CHILD_NAME = `Laufende Versicherungsverträge ${runId}`;

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

async function isClipped(locator: Locator): Promise<boolean> {
  return locator.evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
  );
}

async function openChildFolder(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.goto('/filesystem', { waitUntil: 'networkidle' });
  await applyDocuvateLocale(page, 'de');
  await page.goto(`/filesystem/folders/${rootId}`, { waitUntil: 'networkidle' });
}

let rootId = '';
let childId = '';

test.describe('folder names stay readable', () => {
  test.beforeAll(async ({ request }) => {
    rootId = await createFolder(request, ROOT_NAME, null);
    childId = await createFolder(request, CHILD_NAME, rootId);
  });

  test.afterAll(async ({ request }) => {
    if (childId) await request.delete(`${apiBase}/v1/folders/${childId}`);
    if (rootId) await request.delete(`${apiBase}/v1/folders/${rootId}`);
  });

  for (const width of [1024, 1280]) {
    test(`tree row and folder tile show the full name at ${String(width)} px`, async ({ page }) => {
      await openChildFolder(page, width, 800);
      await page.getByRole('textbox', { name: 'Ordnerbaum durchsuchen' }).first().fill(runId);
      const childTile = page.locator('.filesystem-folder-tile', { hasText: CHILD_NAME });
      await expect(childTile).toBeVisible();
      expect(await isClipped(childTile.locator('.filesystem-folder-tile-name'))).toBe(false);

      await page.mouse.move(width - 5, 795);
      const rootRow = page.locator('.dateisystem-tree-row').filter({
        has: page.locator('.sidebar-tree-name', { hasText: new RegExp(`^${ROOT_NAME}$`) }),
      });
      await expect(rootRow).toBeVisible();
      expect(await isClipped(rootRow.locator('.sidebar-tree-name'))).toBe(false);

      // Hovering reveals the row actions next to the name, never on top of it.
      await rootRow.hover();
      const actionButton = rootRow.locator('.dateisystem-tree-actions button').first();
      await expect(actionButton).toBeVisible();
      const nameBox = await rootRow.locator('a.dateisystem-tree-link').boundingBox();
      const actionBox = await actionButton.boundingBox();
      expect(nameBox && actionBox ? nameBox.x + nameBox.width <= actionBox.x + 1 : false).toBe(
        true
      );
      await assertNoHorizontalOverflow(page);
    });
  }

  test('folder tile wraps a long name without overflow at 390 px', async ({ page }) => {
    await openChildFolder(page, 390, 844);
    const childTile = page.locator('.filesystem-folder-tile', { hasText: CHILD_NAME });
    await childTile.scrollIntoViewIfNeeded();
    await expect(childTile).toBeVisible();
    expect(await isClipped(childTile.locator('.filesystem-folder-tile-name'))).toBe(false);
    await assertNoHorizontalOverflow(page);
  });
});
