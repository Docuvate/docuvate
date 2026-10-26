// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DOCUMENT_LIST_DEFAULT_LIMIT,
  DOCUMENT_LIST_MAX_LIMIT,
  type DocumentListQuery,
} from '@docuvate/contracts';

export function clampDocumentListLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DOCUMENT_LIST_DEFAULT_LIMIT;
  }
  const rounded = Math.floor(limit);
  if (!Number.isFinite(rounded) || rounded < 1) {
    return DOCUMENT_LIST_DEFAULT_LIMIT;
  }
  return Math.min(rounded, DOCUMENT_LIST_MAX_LIMIT);
}

export function isPaginatedDocumentListQuery(filters: DocumentListQuery): boolean {
  return filters.limit !== undefined || filters.cursor !== undefined;
}

export function paginatedFetchLimit(filters: DocumentListQuery): number {
  return clampDocumentListLimit(filters.limit) + 1;
}
