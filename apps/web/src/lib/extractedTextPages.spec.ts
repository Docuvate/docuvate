// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { extractedTextDisplayPages, extractedTextPageNumbers } from './extractedTextPages';

describe('extractedTextPageNumbers', () => {
  it('unions, sorts and de-duplicates pages across sources', () => {
    expect(
      extractedTextPageNumbers([{ page: 3 }, { page: 1 }], [{ page: 2 }, { page: 3 }])
    ).toEqual([1, 2, 3]);
  });

  it('ignores invalid page numbers', () => {
    expect(extractedTextPageNumbers([{ page: 0 }, { page: 1.5 }, { page: 2 }])).toEqual([2]);
  });

  it('returns no pages for empty sources', () => {
    expect(extractedTextPageNumbers([], [])).toEqual([]);
  });
});

describe('extractedTextDisplayPages', () => {
  it('shows only the active page when page-synced', () => {
    expect(extractedTextDisplayPages([1, 2, 27], 27, true)).toEqual([27]);
  });

  it('falls back to every page when the active page has no text source', () => {
    expect(extractedTextDisplayPages([1, 2], 27, true)).toEqual([1, 2]);
  });

  it('shows every page when not page-synced', () => {
    expect(extractedTextDisplayPages([1, 2], 2, false)).toEqual([1, 2]);
  });
});
