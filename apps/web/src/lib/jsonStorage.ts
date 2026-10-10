// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export interface RecentDocumentEntry {
  id: string;
  title: string;
  openedAt: string;
}

function readStringField(obj: object, key: string): string | undefined {
  if (!Object.hasOwn(obj, key)) {
    return undefined;
  }
  const value: unknown = Reflect.get(obj, key);
  return typeof value === 'string' ? value : undefined;
}

function isRecentDocumentEntry(value: unknown): value is RecentDocumentEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const id = readStringField(value, 'id');
  const title = readStringField(value, 'title');
  const openedAt = readStringField(value, 'openedAt');
  return id !== undefined && title !== undefined && openedAt !== undefined;
}

function isRecentDocumentEntryArray(value: unknown): value is RecentDocumentEntry[] {
  return Array.isArray(value) && value.every(isRecentDocumentEntry);
}

export function parseJsonStringArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseJsonRecentDocuments(raw: string): RecentDocumentEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecentDocumentEntryArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
