import { randomUUID } from 'node:crypto';

import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { deliveryNoteTablePdf } from './layout-table-pdf';
import { waitForDocumentLayoutIrReady, waitForSmokeApiReady } from './wait-for-layout-ir';

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
 * Unique filename + unique trailer on the known-good synthetic PDF (same
 * pattern as Workstream B). Do not rewrite the content stream.
 */
export async function uploadLayoutTableDocument(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<string> {
  await waitForSmokeApiReady(request, apiBase);
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const token = randomUUID().replace(/-/g, '').slice(0, 12);
    const upload = await request.post(`${apiBase}/v1/documents`, {
      headers: { origin: webOrigin },
      multipart: {
        file: {
          name: `delivery-note-table-${token}.pdf`,
          mimeType: 'application/pdf',
          buffer: await deliveryNoteTablePdf(token),
        },
      },
    });
    if (!upload.ok()) {
      lastError = new Error(
        `layout fixture upload failed (${String(attempt)}/3): ${String(upload.status())} ${await upload.text()}`
      );
      await sleep(2000 * attempt);
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
      await sleep(2000 * attempt);
    }
  }
  throw lastError ?? new Error('layout fixture upload failed');
}

export async function openLayoutDocumentPage(page: Page, docId: string): Promise<void> {
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.layout-workspace').waitFor({ state: 'visible', timeout: 300_000 });
  await page.locator('.pdf-page-canvas').first().waitFor({ state: 'visible', timeout: 180_000 });
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
