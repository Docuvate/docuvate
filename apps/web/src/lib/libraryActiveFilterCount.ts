import type { DocumentListQuery } from '@docuvate/contracts';

/** Count sidebar filter criteria (status, inbox, label chips) for compact toolbar badge. */
export function countLibraryActiveFilters(filters: DocumentListQuery): number {
  let count = 0;
  if (filters.status) {
    count += 1;
  }
  if (filters.inbox) {
    count += 1;
  }
  count += filters.tagIds?.length ?? 0;
  return count;
}
