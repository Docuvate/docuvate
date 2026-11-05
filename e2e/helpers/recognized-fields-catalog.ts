// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type APIRequestContext, expect } from '@playwright/test';

import { parseJsonItemsArray } from './json-body';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

export interface RecognizedFieldPayload {
  key: string;
  label: string;
  fieldType: string;
  sortOrder: number;
  extractForAllDocuments: boolean;
  gateLabelIds: string[];
  gateLabelMatch: string;
  minLabelConfidence: number | null;
  confidenceGateEnabled: boolean | null;
  showInFilter: boolean;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFieldPayload(value: unknown): RecognizedFieldPayload {
  if (!isRecord(value)) {
    throw new Error('recognized field item is not an object');
  }
  const gateLabelIds = Array.isArray(value.gateLabelIds)
    ? value.gateLabelIds.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    key: typeof value.key === 'string' ? value.key : '',
    label: typeof value.label === 'string' ? value.label : '',
    fieldType: typeof value.fieldType === 'string' ? value.fieldType : 'text',
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : 0,
    extractForAllDocuments: value.extractForAllDocuments === true,
    gateLabelIds,
    gateLabelMatch: typeof value.gateLabelMatch === 'string' ? value.gateLabelMatch : 'any',
    minLabelConfidence:
      typeof value.minLabelConfidence === 'number' ? value.minLabelConfidence : null,
    confidenceGateEnabled:
      typeof value.confidenceGateEnabled === 'boolean' ? value.confidenceGateEnabled : null,
    showInFilter: value.showInFilter === true,
  };
}

export async function listFields(request: APIRequestContext): Promise<RecognizedFieldPayload[]> {
  const res = await request.get(`${apiBase}/v1/recognized-fields`, {
    headers: { origin: webOrigin },
  });
  expect(res.ok(), `list recognized fields: ${String(res.status())}`).toBeTruthy();
  return parseJsonItemsArray(await res.json()).map(toFieldPayload);
}

export async function replaceFields(
  request: APIRequestContext,
  fields: RecognizedFieldPayload[]
): Promise<void> {
  const res = await request.put(`${apiBase}/v1/recognized-fields`, {
    headers: { origin: webOrigin },
    data: { fields: fields.map((field, index) => ({ ...field, sortOrder: index })) },
  });
  expect(
    res.ok(),
    `replace recognized fields: ${String(res.status())} ${await res.text()}`
  ).toBeTruthy();
}
