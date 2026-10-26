// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentSortField, SortOrder } from '@docuvate/contracts';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  isRecord,
  parseOptionalString,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';

const CURSOR_VERSION = 1;

export interface DocumentListCursorPayload {
  v: typeof CURSOR_VERSION;
  sort: DocumentSortField;
  order: SortOrder;
  id: string;
  updatedAt?: string;
  createdAt?: string;
  title?: string;
  documentDate?: string | null;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

const SORT_FIELDS: DocumentSortField[] = ['updatedAt', 'createdAt', 'title', 'documentDate'];
const SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

function isDocumentSortField(value: string): value is DocumentSortField {
  return SORT_FIELDS.some((field) => field === value);
}

function isSortOrder(value: string): value is SortOrder {
  return SORT_ORDERS.some((order) => order === value);
}

function parseSortField(value: unknown): DocumentSortField {
  if (typeof value !== 'string' || !isDocumentSortField(value)) {
    throw new ValidationError('Invalid document list cursor');
  }
  return value;
}

function parseSortOrder(value: unknown): SortOrder {
  if (typeof value !== 'string' || !isSortOrder(value)) {
    throw new ValidationError('Invalid document list cursor');
  }
  return value;
}

export function encodeDocumentListCursor(payload: DocumentListCursorPayload): string {
  const json = JSON.stringify(payload);
  return encodeBase64Url(new TextEncoder().encode(json));
}

export function decodeDocumentListCursor(cursor: string): DocumentListCursorPayload {
  let parsed: unknown;
  try {
    const text = new TextDecoder().decode(decodeBase64Url(cursor.trim()));
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError('Invalid document list cursor');
  }
  if (!isRecord(parsed)) {
    throw new ValidationError('Invalid document list cursor');
  }
  if (parsed.v !== CURSOR_VERSION) {
    throw new ValidationError('Invalid document list cursor');
  }
  const sort = parseSortField(parsed.sort);
  const order = parseSortOrder(parsed.order);
  const id = parseString(parsed.id);
  const documentDateRaw = parsed.documentDate;
  let documentDate: string | null | undefined;
  if (documentDateRaw === null) {
    documentDate = null;
  } else if (documentDateRaw === undefined) {
    documentDate = undefined;
  } else {
    documentDate = parseString(documentDateRaw);
  }
  return {
    v: CURSOR_VERSION,
    sort,
    order,
    id,
    updatedAt: parseOptionalString(parsed.updatedAt) ?? undefined,
    createdAt: parseOptionalString(parsed.createdAt) ?? undefined,
    title: parseOptionalString(parsed.title) ?? undefined,
    documentDate,
  };
}

export function assertCursorMatchesQuery(
  cursor: DocumentListCursorPayload,
  sort: DocumentSortField,
  order: SortOrder
): void {
  if (cursor.sort !== sort || cursor.order !== order) {
    throw new ValidationError('Document list cursor does not match sort parameters');
  }
}
