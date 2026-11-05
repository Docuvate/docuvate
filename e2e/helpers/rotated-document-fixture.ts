// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { type PageRotationDeg, rotatedSyntheticPdf } from './rotated-page-fixture';
import { waitForDocumentLayoutIrReady, waitForSmokeApiReady } from './wait-for-layout-ir';

function readUploadedDocumentId(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string') {
    return body.id;
  }
  throw new Error('rotated fixture upload response missing id');
}

function readLayoutIrPageCount(body: unknown): number {
  if (typeof body !== 'object' || body === null) {
    return 0;
  }
  if (!('pages' in body) || !Array.isArray(body.pages)) {
    return 0;
  }
  return body.pages.length;
}

function readLayoutIrBlockTextSample(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    return '';
  }
  if (!('pages' in body) || !Array.isArray(body.pages)) {
    return '';
  }
  const texts: string[] = [];
  for (const page of body.pages) {
    if (typeof page !== 'object' || page === null) {
      continue;
    }
    if (!('blocks' in page) || !Array.isArray(page.blocks)) {
      continue;
    }
    for (const block of page.blocks) {
      if (typeof block !== 'object' || block === null) {
        continue;
      }
      if ('text' in block && typeof block.text === 'string' && block.text.trim().length > 0) {
        texts.push(block.text.trim());
      }
    }
  }
  return texts.join(' ').slice(0, 200);
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function uploadRotatedDocument(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  rotationDeg: PageRotationDeg
): Promise<string> {
  await waitForSmokeApiReady(request, apiBase);
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const token = randomUUID().replace(/-/g, '').slice(0, 12);
    const upload = await request.post(`${apiBase}/v1/documents`, {
      headers: { origin: webOrigin },
      multipart: {
        file: {
          name: `rotated-${String(rotationDeg)}-${token}.pdf`,
          mimeType: 'application/pdf',
          buffer: await rotatedSyntheticPdf(rotationDeg, token),
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

/** Upload a /Rotate 90 synthetic fixture (bounding-box selection E2E). */
export async function uploadRotatedLayoutDocument(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<string> {
  return uploadRotatedDocument(request, apiBase, webOrigin, 90);
}

export async function assertLayoutIrReadable(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  docId: string
): Promise<void> {
  const res = await request.get(`${apiBase}/v1/documents/${docId}/layout-ir`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok(), `layout-ir: ${String(res.status())}`).toBe(true);
  const body: unknown = await res.json();
  expect(readLayoutIrPageCount(body)).toBeGreaterThanOrEqual(1);
  expect(readLayoutIrBlockTextSample(body).length).toBeGreaterThan(0);
}

export async function openRotatedDocumentPage(page: Page, docId: string): Promise<void> {
  await page.goto(`/documents/${docId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.pdf-viewer, .layout-workspace').first().waitFor({
    state: 'visible',
    timeout: 300_000,
  });
  const wrap = page.locator('.pdf-page-wrap').first();
  await expect(wrap).toHaveAttribute('data-pdf-rotate', /^(90|180|270)$/, { timeout: 60_000 });
}
