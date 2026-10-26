// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  decodeTagSearchCursor,
  encodeTagSearchCursor,
} from './tag-search-cursor.js';

describe('tag search cursor', () => {
  it('round-trips payload', () => {
    const cursor = encodeTagSearchCursor({
      v: 1,
      sortName: 'Alpha',
      id: 'tag-id-1',
    });
    const decoded = decodeTagSearchCursor(cursor);
    expect(decoded).toEqual({
      v: 1,
      sortName: 'Alpha',
      id: 'tag-id-1',
    });
  });
});
