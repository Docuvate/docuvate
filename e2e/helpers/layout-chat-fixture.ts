import fs from 'node:fs';
import type { APIRequestContext, Page } from '@playwright/test';

import { deliveryNoteTablePdfPath } from './layout-table-pdf';
import { waitForDocumentLayoutIrReady } from './wait-for-layout-ir';

export async function uploadLayoutTableDocument(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<string> {
  const pdfPath = deliveryNoteTablePdfPath();
  const upload = await request.post(`${apiBase}/v1/documents`, {
    headers: { origin: webOrigin },
    multipart: {
      file: {
        name: 'delivery-note-table.pdf',
        mimeType: 'application/pdf',
        buffer: fs.readFileSync(pdfPath),
      },
    },
  });
  if (!upload.ok()) {
    throw new Error(`layout fixture upload failed: ${upload.status()} ${await upload.text()}`);
  }
  const docId = String(((await upload.json()) as { id: string }).id);
  await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);
  return docId;
}

export async function openLayoutDocumentPage(page: Page, docId: string): Promise<void> {
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 180_000 });
  const chatDetailTab = page.getByRole('tab', { name: /^Chat$/i });
  if ((await chatDetailTab.getAttribute('aria-selected')) === 'true') {
    await chatDetailTab.click();
  }
  await page.locator('.layout-side-tabs').waitFor({ state: 'visible', timeout: 120_000 });
}
