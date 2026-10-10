// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { sanitizeChatThreadDocumentIds } from './chat-thread-document-ids.js';

describe('sanitizeChatThreadDocumentIds', () => {
  const valid = '550e8400-e29b-41d4-a716-446655440000';

  it('removes null entries from array_agg', () => {
    expect(sanitizeChatThreadDocumentIds([null, valid])).toEqual([valid]);
  });

  it('returns empty for null aggregate', () => {
    expect(sanitizeChatThreadDocumentIds(null)).toEqual([]);
  });

  it('rejects literal null string', () => {
    expect(sanitizeChatThreadDocumentIds(['null', valid])).toEqual([valid]);
  });
});
