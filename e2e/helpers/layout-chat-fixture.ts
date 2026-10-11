import { expect } from '@playwright/test';
import fs from 'node:fs';
import type { APIRequestContext, Page } from '@playwright/test';

import { deliveryNoteTablePdfPath } from './layout-table-pdf';
import { waitForDocumentLayoutIrReady } from './wait-for-layout-ir';

const DOC_CHAT_QUESTION = 'Wie viele Widget A sind in der Lieferung?';

type DocChatMessage = {
  id: string;
  generationStatus?: string;
  content?: string;
};

export async function verifyDocumentChatRespondsWithin5s(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  documentId: string
): Promise<void> {
  const threadRes = await request.post(`${apiBase}/v1/documents/${documentId}/chat/threads`, {
    headers: { origin: webOrigin },
    data: { title: 'E2E layout doc chat' },
  });
  if (!threadRes.ok()) {
    throw new Error(`doc chat thread: ${threadRes.status()} ${await threadRes.text()}`);
  }
  const threadId = String(((await threadRes.json()) as { thread: { id: string } }).thread.id);
  const startedAt = Date.now();
  const sendRes = await request.post(
    `${apiBase}/v1/documents/${documentId}/chat/threads/${threadId}/messages`,
    {
      headers: { origin: webOrigin },
      data: { message: DOC_CHAT_QUESTION },
    }
  );
  if (!sendRes.ok()) {
    throw new Error(`doc chat send: ${sendRes.status()} ${await sendRes.text()}`);
  }
  const assistantId = String(
    ((await sendRes.json()) as { assistantMessage: { id: string } }).assistantMessage.id
  );
  const messagesPath = `${apiBase}/v1/documents/${documentId}/chat/threads/${threadId}/messages`;
  let last: DocChatMessage | undefined;
  await expect
    .poll(
      async () => {
        const list = await request.get(messagesPath, { headers: { origin: webOrigin } });
        const messages = ((await list.json()) as { messages: DocChatMessage[] }).messages;
        last = messages.find((m) => m.id === assistantId);
        return last?.generationStatus ?? 'pending';
      },
      { timeout: 60_000 }
    )
    .toBe('done');
  expect(Date.now() - startedAt).toBeLessThan(5_000);
  expect((last?.content ?? '').trim().length).toBeGreaterThan(0);
}

export { DOC_CHAT_QUESTION };

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
  await verifyDocumentChatRespondsWithin5s(request, apiBase, webOrigin, docId);
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
