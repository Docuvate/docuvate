// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

const NARROW_VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
] as const;

test.use({ storageState: smokeFixtureStoragePath() });

async function openLibrary(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/documents', { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
  await page.locator('.library-list-toolbar').waitFor({ state: 'visible', timeout: 90_000 });
  await expect(
    page.locator('.library-doc-stack-item-inner, .library-table tbody tr').first()
  ).toBeVisible({
    timeout: 90_000,
  });
}

async function boxOf(
  locator: Locator
): Promise<{ x: number; y: number; width: number; height: number }> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box ?? { x: 0, y: 0, width: 0, height: 0 };
}

async function expectInViewport(page: Page, locator: Locator): Promise<void> {
  const box = await boxOf(locator);
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 0.5);
}

async function expectSameRow(a: Locator, b: Locator): Promise<void> {
  const boxA = await boxOf(a);
  const boxB = await boxOf(b);
  expect(Math.abs(boxA.y + boxA.height / 2 - (boxB.y + boxB.height / 2))).toBeLessThanOrEqual(4);
}

test.describe('document list toolbar at small widths', () => {
  test.describe.configure({ timeout: 180_000 });

  let docId = '';

  test.beforeAll(async ({ request }) => {
    const pdf = Buffer.concat([
      fs.readFileSync(fixturePdf),
      Buffer.from(`\n%%E2E_LIBRARY_TOOLBAR=${randomUUID()}\n`, 'utf8'),
    ]);
    const create = await request.post(`${apiBase}/v1/documents`, {
      headers: { origin: webOrigin },
      multipart: {
        file: { name: 'library-toolbar.pdf', mimeType: 'application/pdf', buffer: pdf },
      },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    docId = ((await create.json()) as { id: string }).id;
  });

  test.afterAll(async ({ request }) => {
    if (docId) {
      await request.delete(`${apiBase}/v1/documents/${docId}`, { headers: { origin: webOrigin } });
    }
  });

  for (const viewport of NARROW_VIEWPORTS) {
    test(`header, search and filter stay compact and reachable (${String(viewport.width)})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openLibrary(page);

      const header = page.locator('.library-page-header');
      const savedViews = header.getByRole('button', { name: /Gespeicherte Ansichten/ });
      const viewSwitcher = header.getByRole('radiogroup');
      const sort = header.locator('.library-toolbar-sort');
      await expectInViewport(page, header.locator('h1'));
      await expectInViewport(page, savedViews);
      await expectInViewport(page, viewSwitcher);
      await expectInViewport(page, sort);
      await expectSameRow(header.locator('h1'), savedViews);
      await expectSameRow(viewSwitcher, sort);
      for (const option of await viewSwitcher.getByRole('radio').all()) {
        const fits = await option.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
        expect(fits, 'view mode label is not clipped').toBe(true);
      }

      const search = page.locator('.library-list-search input');
      const filterToggle = page.locator('button.library-filter-toggle');
      const submit = page.locator('.library-list-search').getByRole('button', { name: 'Suchen' });
      await expectSameRow(search, filterToggle);
      await expectSameRow(search, submit);
      await expectInViewport(page, submit);
      await expect(filterToggle).toHaveText('Filter');

      // The first document sits in the upper half of the screen instead of below a stack of controls.
      const firstRow = page.locator('.library-doc-stack-item-inner').first();
      expect((await boxOf(firstRow)).y).toBeLessThan(viewport.height * 0.6);
      await assertNoHorizontalOverflow(page);

      await savedViews.click();
      const menu = page.getByRole('menu');
      for (const name of [/Ansicht speichern/, /^Gespeicherte Ansichten$/]) {
        await expectInViewport(page, menu.getByRole('menuitem', { name }));
      }
      await menu.getByRole('menuitem', { name: /Ansicht speichern/ }).click();
      const dialog = page.getByRole('dialog', { name: /Ansicht speichern/ });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Abbrechen' }).click();
      await expect(dialog).toBeHidden();

      await filterToggle.click();
      await expect(page.locator('.library-filter-drawer')).toBeVisible({ timeout: 30_000 });
      await page.keyboard.press('Escape');
      await expect(page.locator('.library-filter-drawer')).toBeHidden();

      // No drag and drop on phones: the upload button opens the file picker directly.
      const chooser = page.waitForEvent('filechooser');
      await page.locator('.upload-compact-bar').getByRole('button', { name: 'Hochladen' }).click();
      expect((await chooser).isMultiple()).toBe(true);
    });
  }

  test('tablet: list uses the full width and search fits one row (1024)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await openLibrary(page);
    const layout = await boxOf(page.locator('.library-layout'));
    const card = await boxOf(page.locator('.library-doc-table-card'));
    expect(card.width).toBeGreaterThan(layout.width * 0.95);
    const search = page.locator('.library-list-search input');
    await expectSameRow(search, page.locator('button.library-filter-toggle'));
    await expectSameRow(search, page.locator('.library-list-search button[type="submit"]'));
    await expectSameRow(
      page.locator('.library-page-header .library-saved-views-trigger'),
      page.locator('.library-page-header .library-toolbar-sort')
    );
    await assertNoHorizontalOverflow(page);
  });

  test('desktop keeps labelled saved-view menu (1280)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openLibrary(page);
    await expect(page.locator('.library-saved-views-trigger-label')).toBeVisible();
    await expect(page.getByTestId('library-filter-panel')).toBeVisible();
    await page
      .locator('.library-page-header')
      .getByRole('button', { name: /Gespeicherte Ansichten/ })
      .click();
    await page.getByRole('menuitem', { name: /^Gespeicherte Ansichten$/ }).click();
    await expect(page).toHaveURL(/\/documents\/views/);
    await assertNoHorizontalOverflow(page);
  });
});
