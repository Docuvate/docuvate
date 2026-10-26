// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type { APIRequestContext } from '@playwright/test';

const LONG_STEM =
  'Betriebskostenabrechnungsnachzahlungsfestsetzungsbescheid';

export function longLabelNames(count = 25): string[] {
  const names: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    const suffix = `-${String(index).padStart(2, '0')}-${randomUUID().slice(0, 8)}`;
    names.push(`${LONG_STEM}${suffix}`);
  }
  return names;
}

export async function assignLongLabels(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  documentId: string,
  names: string[]
): Promise<void> {
  for (const name of names) {
    const created = await request.post(`${apiBase}/v1/tags`, {
      headers: { origin: webOrigin },
      data: { name },
    });
    if (!created.ok()) {
      throw new Error(`create tag failed: ${created.status()} ${await created.text()}`);
    }
    const body: unknown = await created.json();
    const tagId =
      typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string'
        ? body.id
        : '';
    if (!tagId) {
      throw new Error('create tag response missing id');
    }
    const assign = await request.post(`${apiBase}/v1/documents/${documentId}/tags/${tagId}`, {
      headers: { origin: webOrigin },
    });
    if (!assign.ok()) {
      throw new Error(`assign tag failed: ${assign.status()} ${await assign.text()}`);
    }
  }
}
