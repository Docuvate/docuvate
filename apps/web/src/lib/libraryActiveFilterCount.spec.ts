import { describe, expect, it } from 'vitest';
import { countLibraryActiveFilters } from './libraryActiveFilterCount';

describe('countLibraryActiveFilters', () => {
  it('counts status, inbox, and label filters', () => {
    expect(countLibraryActiveFilters({})).toBe(0);
    expect(countLibraryActiveFilters({ status: 'ready' })).toBe(1);
    expect(countLibraryActiveFilters({ inbox: true, tagIds: ['a', 'b'] })).toBe(3);
  });
});
