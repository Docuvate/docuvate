// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseJsonUnknown(raw: string): unknown {
  return JSON.parse(raw);
}

export function parseJsonRecord(raw: string): Record<string, unknown> {
  const parsed = parseJsonUnknown(raw);
  if (!isRecord(parsed)) {
    throw new Error('expected JSON object');
  }
  return parsed;
}

export function readStringProperty(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

export function readBooleanProperty(
  record: Record<string, unknown>,
  key: string
): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function readRequestBodyText(init?: RequestInit): string {
  const body = init?.body;
  if (body === undefined || body === null) {
    return '{}';
  }
  if (typeof body === 'string') {
    return body;
  }
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  if (body instanceof ArrayBuffer) {
    return new TextDecoder().decode(body);
  }
  if (ArrayBuffer.isView(body)) {
    return new TextDecoder().decode(body);
  }
  if (typeof body === 'object' && 'text' in body && typeof body.text === 'function') {
    throw new Error('async request body (Blob/FormData) is not supported in this test helper');
  }
  return JSON.stringify(body);
}

export function parseRequestJsonRecord(init?: RequestInit): Record<string, unknown> {
  return parseJsonRecord(readRequestBodyText(init));
}

export function readPassageIds(body: Record<string, unknown>): string[] {
  const passages = body.passages;
  if (!Array.isArray(passages)) {
    return [];
  }
  const ids: string[] = [];
  for (const entry of passages) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = entry.id;
    if (typeof id === 'string') {
      ids.push(id);
    }
  }
  return ids;
}

export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}
