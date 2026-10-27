// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ValidationError } from '../../domain/errors.js';
import { isRecord, parseString } from '../database/row-parse.js';

const CURSOR_VERSION = 1;

export interface IdTiebreakerCursorPayload {
  v: typeof CURSOR_VERSION;
  id: string;
  sortValue?: string | number;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

function parseSortValue(value: unknown): string | number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  throw new ValidationError('Invalid list cursor');
}

export function encodeIdTiebreakerCursor(payload: IdTiebreakerCursorPayload): string {
  const json = JSON.stringify(payload);
  return encodeBase64Url(new TextEncoder().encode(json));
}

export function decodeIdTiebreakerCursor(cursor: string): IdTiebreakerCursorPayload {
  let parsed: unknown;
  try {
    const text = new TextDecoder().decode(decodeBase64Url(cursor.trim()));
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError('Invalid list cursor');
  }
  if (!isRecord(parsed)) {
    throw new ValidationError('Invalid list cursor');
  }
  if (parsed.v !== CURSOR_VERSION) {
    throw new ValidationError('Invalid list cursor');
  }
  return {
    v: CURSOR_VERSION,
    id: parseString(parsed.id),
    sortValue: parseSortValue(parsed.sortValue),
  };
}

export interface IdTiebreakerKeysetSql {
  conditionSql: string;
  params: unknown[];
}

/** Keyset for `(sortColumn, idColumn)` ordered DESC, DESC. */
export function buildDescIdTiebreakerKeyset(
  sortColumnSql: string,
  idColumnSql: string,
  cursor: IdTiebreakerCursorPayload,
  paramStartIndex: number,
  sortValueCast?: string
): IdTiebreakerKeysetSql {
  if (cursor.sortValue === undefined) {
    throw new ValidationError('Invalid list cursor');
  }
  const sortParam = `$${String(paramStartIndex)}`;
  const idParam = `$${String(paramStartIndex + 1)}`;
  const cast = sortValueCast ?? '';
  return {
    conditionSql: `(${sortColumnSql}, ${idColumnSql}) < (${sortParam}${cast}, ${idParam}::uuid)`,
    params: [cursor.sortValue, cursor.id],
  };
}

/** Keyset for `(sortColumn, idColumn)` ordered ASC, ASC. */
export function buildAscIdTiebreakerKeyset(
  sortColumnSql: string,
  idColumnSql: string,
  cursor: IdTiebreakerCursorPayload,
  paramStartIndex: number,
  sortValueCast?: string
): IdTiebreakerKeysetSql {
  if (cursor.sortValue === undefined) {
    throw new ValidationError('Invalid list cursor');
  }
  const sortParam = `$${String(paramStartIndex)}`;
  const idParam = `$${String(paramStartIndex + 1)}`;
  const cast = sortValueCast ?? '';
  return {
    conditionSql: `(${sortColumnSql}, ${idColumnSql}) > (${sortParam}${cast}, ${idParam}::uuid)`,
    params: [cursor.sortValue, cursor.id],
  };
}

/** Keyset for `(sortColumn, idColumn)` ordered DESC, DESC when id is text (not uuid). */
export function buildDescTextIdTiebreakerKeyset(
  sortColumnSql: string,
  idColumnSql: string,
  cursor: IdTiebreakerCursorPayload,
  paramStartIndex: number,
  sortValueCast?: string
): IdTiebreakerKeysetSql {
  if (cursor.sortValue === undefined) {
    throw new ValidationError('Invalid list cursor');
  }
  const sortParam = `$${String(paramStartIndex)}`;
  const idParam = `$${String(paramStartIndex + 1)}`;
  const cast = sortValueCast ?? '';
  return {
    conditionSql: `(${sortColumnSql}, ${idColumnSql}) < (${sortParam}${cast}, ${idParam})`,
    params: [cursor.sortValue, cursor.id],
  };
}

export function parseOptionalCursor(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed;
}
