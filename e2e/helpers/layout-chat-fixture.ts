import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

import { expect } from '@playwright/test';
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

function readUploadedDocumentId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('layout fixture upload response missing id');
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Unique filename + trailing bytes so hash-identical leftover docs on the shared
 * smoke stack cannot return an already-failed extraction. Retry a few times
 * when enqueue marks the new row failed immediately.
 */
export async function uploadLayoutTableDocument(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<string> {
  const basePdf = fs.readFileSync(deliveryNoteTablePdfPath());
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const token = randomUUID().replace(/-/g, '').slice(0, 12);
    const upload = await request.post(`${apiBase}/v1/documents`, {
      headers: { origin: webOrigin },
      multipart: {
        file: {
          name: `delivery-note-table-${token}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.concat([
            basePdf,
            Buffer.from(`\n%%LAYOUT_TABLE_FIXTURE=${token}\n`, 'utf8'),
          ]),
        },
      },
    });
    if (!upload.ok()) {
      lastError = new Error(
        `layout fixture upload failed (${String(attempt)}/3): ${String(upload.status())} ${await upload.text()}`
      );
      await sleep(2000);
      continue;
    }
    const docId = readUploadedDocumentId(await upload.json());
    try {
      await waitForDocumentLayoutIrReady(request, apiBase, webOrigin, docId);
      return docId;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await request.delete(`${apiBase}/v1/documents/${docId}`, {
        headers: { origin: webOrigin },
      });
      await sleep(2000);
    }
  }
  throw lastError ?? new Error('layout fixture upload failed');
}

export async function openLayoutDocumentPage(page: Page, docId: string): Promise<void> {
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 180_000 });
  const chatSideTab = page.locator('.layout-side-tabs').getByRole('tab', { name: /^Chat$/i });
  if (
    (await chatSideTab.count()) > 0 &&
    (await chatSideTab.getAttribute('aria-selected')) === 'true'
  ) {
    await chatSideTab.click();
  }
  await page.locator('.layout-side-tabs').waitFor({ state: 'visible', timeout: 120_000 });
}

/** Open Erweitert → Vergleich and wait until the compare stage is visible (Original mode). */
export async function openLayoutAdvancedCompare(page: Page): Promise<void> {
  await page
    .locator('.layout-ir-skeleton')
    .waitFor({ state: 'hidden', timeout: 180_000 })
    .catch(() => undefined);

  const toolbar = page.getByTestId('layout-viewer-toolbar');
  const originalMode = toolbar.getByRole('radio', { name: /Original/i });
  if ((await originalMode.getAttribute('aria-checked')) !== 'true') {
    await originalMode.click();
  }

  const panel = page.locator('.layout-advanced-panel');
  const isOpen = await panel.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!isOpen) {
    await page.locator('.layout-advanced-summary').scrollIntoViewIfNeeded();
    await page.locator('.layout-advanced-summary').click();
  }
  await expect(page.locator('.layout-advanced-body')).toBeVisible({ timeout: 60_000 });

  const compareBtn = page.locator('.layout-advanced-view-switch').getByRole('radio', {
    name: /Compare|Vergleich/i,
  });
  await compareBtn.scrollIntoViewIfNeeded();
  await expect(compareBtn).toBeEnabled({ timeout: 180_000 });
  if ((await compareBtn.getAttribute('aria-checked')) !== 'true') {
    await compareBtn.evaluate((node) => {
      (node as HTMLButtonElement).click();
    });
  }

  await page.locator('[data-testid="layout-compare-stage"]').waitFor({
    state: 'visible',
    timeout: 180_000,
  });
}
