// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { countLibraryActiveFilters } from './libraryActiveFilterCount';

describe('countLibraryActiveFilters', () => {
  it('counts status, inbox, labels, dates, and field filters', () => {
    expect(countLibraryActiveFilters({})).toBe(0);
    expect(countLibraryActiveFilters({ status: 'ready' })).toBe(1);
    expect(countLibraryActiveFilters({ inbox: true, tagIds: ['a', 'b'] })).toBe(3);
    expect(
      countLibraryActiveFilters({
        documentDateFrom: '2024-01-01',
        fieldFilters: [{ fieldKey: 'absender', valueText: 'Acme' }],
      })
    ).toBe(2);
  });
});
