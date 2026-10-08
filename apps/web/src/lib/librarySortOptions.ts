import type { TFunction } from 'i18next';

export function librarySortSelectOptions(t: TFunction) {
  return [
    { value: 'updatedAt:desc', label: t('library.sortUpdatedDesc') },
    { value: 'updatedAt:asc', label: t('library.sortUpdatedAsc') },
    { value: 'createdAt:desc', label: t('library.sortCreatedDesc') },
    { value: 'title:asc', label: t('library.sortTitleAsc') },
    { value: 'documentDate:desc', label: t('library.sortDocumentDateDesc') },
  ] as const;
}
