// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';

import { showLayoutPane } from '../../helpers/layout-pane';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { waitForDocumentLayoutIrReady } from '../../helpers/wait-for-layout-ir';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
/** Synthetic 3-page PDF (scripts/screenshots/seeds/generate-e2e-multipage-fixture.mjs). */
const fixturePdf = path.join(process.cwd(), 'fixtures/synthetic-multipage.pdf');
const TEXT_CONTAINERS = ['.layout-text-stage', '.extracted-text-panel', '.extracted-text-body'];

test.use({ storageState: smokeFixtureStoragePath() });

function readDocumentId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('upload response missing id');
}

async function uploadMultipagePdf(request: APIRequestContext): Promise<string> {
  // Unique trailer comment keeps the content hash fresh without touching the PDF body.
  const buffer = Buffer.concat([
    fs.readFileSync(fixturePdf),
    Buffer.from(`\n%%TEXT_VIEW_FIXTURE=${randomUUID()}\n`, 'utf8'),
  ]);
  const upload = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: { name: 'synthetic-multipage.pdf', mimeType: 'application/pdf', buffer },
    },
  });
  expect(upload.ok(), `upload ${String(upload.status())}`).toBeTruthy();
  return readDocumentId(await upload.json());
}

/** Original and recognised text are page views in the viewer's "Ansicht" menu. */
async function chooseView(page: Page, view: RegExp): Promise<void> {
  await page
    .getByTestId('layout-viewer-toolbar')
    .getByRole('button', { name: /^(Ansicht|View):/ })
    .click();
  await page.getByRole('menuitemradio', { name: view }).click();
}

async function openTextView(page: Page, docId: string): Promise<Locator> {
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 120_000 });
  await showLayoutPane(page, 'document');
  await chooseView(page, /^(Erkannter Text|Recognised text)$/);
  const body = page.locator('.layout-text-stage .extracted-text-body');
  await expect(body).toBeVisible({ timeout: 30_000 });
  return body;
}

async function expectPageText(body: Locator, pageNumber: number): Promise<void> {
  await expect(body.locator('section[data-page]')).toHaveCount(1);
  await expect(body.locator('section[data-page]')).toHaveAttribute('data-page', String(pageNumber));
  await expect(body).toContainText(`E2E_MULTIPAGE_TEXT_PAGE_${String(pageNumber)}`, {
    timeout: 30_000,
  });
}

async function expectTextFitsViewport(page: Page): Promise<void> {
  await assertNoHorizontalOverflow(page, TEXT_CONTAINERS);
  const width = page.viewportSize()?.width ?? 0;
  for (const selector of TEXT_CONTAINERS) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box, selector).not.toBeNull();
    if (box) {
      expect(box.x + box.width, selector).toBeLessThanOrEqual(width + 1);
    }
  }
}

test.describe('document text view (multi-page)', () => {
  test('shows the recognised text per page and pages through it', async ({ page, request }) => {
    test.setTimeout(360_000);
    const docId = await uploadMultipagePdf(request);
    await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);

    await page.setViewportSize({ width: 1280, height: 800 });
    const body = await openTextView(page, docId);
    await expectPageText(body, 1);

    const nav = page.locator('.extracted-text-page-nav');
    const next = nav.getByRole('button', { name: /Nächste Seite|Next page/ });
    const prev = nav.getByRole('button', { name: /Vorherige Seite|Previous page/ });
    await expect(prev).toBeDisabled();

    await next.click();
    await expectPageText(body, 2);
    await next.click();
    await expectPageText(body, 3);
    await expect(next).toBeDisabled();
    await prev.click();
    await expectPageText(body, 2);

    // Switching back to the PDF keeps the page; the text view picks it up again.
    await chooseView(page, /^Original$/);
    await chooseView(page, /^(Erkannter Text|Recognised text)$/);
    await expectPageText(body, 2);

    await page.locator('.extracted-text-d7-search').fill('E2E_MULTIPAGE_TEXT_PAGE_2');
    await expect(body.locator('.extracted-text-line-search-hit')).toHaveCount(1);
    await expectTextFitsViewport(page);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 320, height: 640 },
    ]) {
      await page.setViewportSize(viewport);
      const narrowBody = await openTextView(page, docId);
      await expectPageText(narrowBody, 1);
      await page
        .locator('.extracted-text-page-nav')
        .getByRole('button', { name: /Nächste Seite|Next page/ })
        .click();
      await expectPageText(narrowBody, 2);
      await expectTextFitsViewport(page);
    }
  });
});
