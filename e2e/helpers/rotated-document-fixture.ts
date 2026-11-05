// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { openLayoutDocumentPage } from './layout-document-fixture';
import { waitForDocumentLayoutIrReady, waitForSmokeApiReady } from './wait-for-layout-ir';

function readUploadedDocumentId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('rotated fixture upload response missing id');
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function rotatedFixtureBytes(uniqueToken: string): Buffer {
  const base = readFileSync(join(process.cwd(), 'fixtures/synthetic-upload-rotated-90.pdf'));
  return Buffer.concat([base, Buffer.from(`\n%%ROTATED_BBOX_E2E=${uniqueToken}\n`, 'utf8')]);
}

/** Upload the /Rotate 90 synthetic fixture and wait until layout IR is ready. */
export async function uploadRotatedLayoutDocument(
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
          name: `rotated-bbox-${token}.pdf`,
          mimeType: 'application/pdf',
          buffer: rotatedFixtureBytes(token),
        },
      },
    });
    if (!upload.ok()) {
      lastError = new Error(
        `rotated fixture upload failed (${String(attempt)}/3): ${String(upload.status())} ${await upload.text()}`
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
  throw lastError ?? new Error('rotated fixture upload failed');
}

export async function openRotatedDocumentPage(page: Page, docId: string): Promise<void> {
  await openLayoutDocumentPage(page, docId);
  const wrap = page.locator('.pdf-page-wrap').first();
  await expect(wrap).toHaveAttribute('data-pdf-rotate', /90/, { timeout: 60_000 });
}
