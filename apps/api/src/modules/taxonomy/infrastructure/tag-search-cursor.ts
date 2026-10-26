// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ValidationError } from '../../../shared/domain/errors.js';
import {
  isRecord,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';

const CURSOR_VERSION = 1;

export interface TagSearchCursorPayload {
  v: typeof CURSOR_VERSION;
  sortName: string;
  id: string;
}

function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function decodeBase64Url(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

export function encodeTagSearchCursor(payload: TagSearchCursorPayload): string {
  const json = JSON.stringify(payload);
  return encodeBase64Url(new TextEncoder().encode(json));
}

export function decodeTagSearchCursor(cursor: string): TagSearchCursorPayload {
  let parsed: unknown;
  try {
    const text = new TextDecoder().decode(decodeBase64Url(cursor.trim()));
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError('Invalid tag search cursor');
  }
  if (!isRecord(parsed)) {
    throw new ValidationError('Invalid tag search cursor');
  }
  if (parsed.v !== CURSOR_VERSION) {
    throw new ValidationError('Invalid tag search cursor');
  }
  return {
    v: CURSOR_VERSION,
    sortName: parseString(parsed.sortName),
    id: parseString(parsed.id),
  };
}
