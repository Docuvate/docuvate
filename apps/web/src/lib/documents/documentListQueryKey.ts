// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery, SavedDocumentViewFieldFilterDto } from '@docuvate/contracts';

function stableFieldFilters(
  fieldFilters: SavedDocumentViewFieldFilterDto[] | undefined
): SavedDocumentViewFieldFilterDto[] | undefined {
  if (!fieldFilters?.length) {
    return undefined;
  }
  return [...fieldFilters]
    .map((entry) => ({
      fieldKey: entry.fieldKey.trim(),
      valueText: entry.valueText.trim(),
    }))
    .filter((entry) => entry.fieldKey.length > 0 && entry.valueText.length > 0)
    .sort((a, b) => a.fieldKey.localeCompare(b.fieldKey) || a.valueText.localeCompare(b.valueText));
}

/** Stable React Query key for document library list fetches (avoids mobile refetch loops). */
export function documentListQueryKey(filters: DocumentListQuery | null): readonly unknown[] {
  if (filters === null) {
    return ['documents', 'list', 'disabled'];
  }
  const tagIds = filters.tagIds?.length ? [...filters.tagIds].sort() : undefined;
  const normalized: DocumentListQuery = {
    q: filters.q?.trim() ? filters.q.trim() : undefined,
    status: filters.status,
    tagId: filters.tagId,
    tagIds,
    recognizedFieldKey: filters.recognizedFieldKey,
    recognizedFieldValue: filters.recognizedFieldValue,
    fieldFilterKey: filters.fieldFilterKey,
    fieldFilterValue: filters.fieldFilterValue,
    fieldFilters: stableFieldFilters(filters.fieldFilters),
    folderId: filters.folderId,
    unfiled: filters.unfiled ?? undefined,
    inbox: filters.inbox ?? undefined,
    withoutNonInboxLabel: filters.withoutNonInboxLabel ?? undefined,
    documentDateFrom: filters.documentDateFrom,
    documentDateTo: filters.documentDateTo,
    sort: filters.sort ?? 'updatedAt',
    order: filters.order ?? 'desc',
    includeTagSuggestions: filters.includeTagSuggestions ?? undefined,
  };
  return ['documents', 'list', normalized];
}
