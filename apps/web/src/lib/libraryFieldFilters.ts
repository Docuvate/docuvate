// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery, SavedDocumentViewFieldFilterDto } from '@docuvate/contracts';

export function normalizeFieldFilters(
  filters: SavedDocumentViewFieldFilterDto[] | undefined
): SavedDocumentViewFieldFilterDto[] {
  if (!filters?.length) return [];
  const out: SavedDocumentViewFieldFilterDto[] = [];
  for (const entry of filters) {
    const fieldKey = entry.fieldKey.trim();
    const valueText = entry.valueText.trim();
    if (!fieldKey || !valueText) continue;
    const existing = out.find((row) => row.fieldKey === fieldKey);
    if (existing) {
      existing.valueText = valueText;
    } else {
      out.push({ fieldKey, valueText });
    }
  }
  return out;
}

export function fieldFilterValueForKey(
  filters: SavedDocumentViewFieldFilterDto[] | undefined,
  fieldKey: string
): string {
  return filters?.find((row) => row.fieldKey === fieldKey)?.valueText ?? '';
}

export function patchFieldFilter(
  filters: SavedDocumentViewFieldFilterDto[] | undefined,
  fieldKey: string,
  valueText: string
): SavedDocumentViewFieldFilterDto[] {
  const trimmedKey = fieldKey.trim();
  const trimmedValue = valueText.trim();
  const rest = (filters ?? []).filter((row) => row.fieldKey !== trimmedKey);
  if (!trimmedValue) return rest;
  return [...rest, { fieldKey: trimmedKey, valueText: trimmedValue }];
}

export function documentListQueryWithFieldFilters(
  query: DocumentListQuery
): DocumentListQuery {
  const fieldFilters = normalizeFieldFilters(query.fieldFilters);
  if (fieldFilters.length === 0) {
    return query;
  }
  const rest = { ...query };
  delete rest.fieldFilterKey;
  delete rest.fieldFilterValue;
  delete rest.recognizedFieldKey;
  delete rest.recognizedFieldValue;
  return { ...rest, fieldFilters };
}
