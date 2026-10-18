// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TFunction } from 'i18next';

export type LibrarySortField = 'updatedAt' | 'createdAt' | 'title' | 'documentDate';
export type LibrarySortOrder = 'asc' | 'desc';

export function parseLibrarySortSelectValue(value: string): {
  sort: LibrarySortField;
  order: LibrarySortOrder;
} {
  const [sortPart, orderPart] = value.split(':');
  const sort: LibrarySortField =
    sortPart === 'createdAt' || sortPart === 'title' || sortPart === 'documentDate'
      ? sortPart
      : 'updatedAt';
  const order: LibrarySortOrder = orderPart === 'asc' ? 'asc' : 'desc';
  return { sort, order };
}

export function librarySortSelectOptions(t: TFunction) {
  return [
    { value: 'updatedAt:desc', label: t('library.sortUpdatedDesc') },
    { value: 'updatedAt:asc', label: t('library.sortUpdatedAsc') },
    { value: 'createdAt:desc', label: t('library.sortCreatedDesc') },
    { value: 'title:asc', label: t('library.sortTitleAsc') },
    { value: 'documentDate:desc', label: t('library.sortDocumentDateDesc') },
  ] as const;
}
