// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseString } from '../../../shared/infrastructure/database/row-parse.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isChatThreadDocumentId(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Drops NULL/invalid ids from SQL array_agg (library threads have no junction rows). */
export function sanitizeChatThreadDocumentIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    if (raw == null) {
      return [];
    }
    const single = parseString(raw);
    return isChatThreadDocumentId(single) ? [single] : [];
  }
  return raw
    .filter((id) => id != null)
    .map(String)
    .filter((id) => isChatThreadDocumentId(id));
}
