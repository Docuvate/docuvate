// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseLibrarySortSelectValue } from './librarySortOptions';

const DEFAULT_SORT = 'updatedAt';
const DEFAULT_ORDER = 'desc';

export function readLibrarySortFromSearchParams(searchParams: {
  get: (key: string) => string | null;
}): { sort: 'updatedAt' | 'createdAt' | 'title' | 'documentDate'; order: 'asc' | 'desc' } {
  return parseLibrarySortSelectValue(
    `${searchParams.get('sort') ?? DEFAULT_SORT}:${searchParams.get('order') ?? DEFAULT_ORDER}`
  );
}

export function writeLibrarySortToSearchParams(
  params: URLSearchParams,
  sort: string | undefined,
  order: string | undefined
): void {
  const resolvedSort = sort ?? DEFAULT_SORT;
  const resolvedOrder = order ?? DEFAULT_ORDER;
  if (resolvedSort === DEFAULT_SORT && resolvedOrder === DEFAULT_ORDER) {
    params.delete('sort');
    params.delete('order');
    return;
  }
  params.set('sort', resolvedSort);
  params.set('order', resolvedOrder);
}
