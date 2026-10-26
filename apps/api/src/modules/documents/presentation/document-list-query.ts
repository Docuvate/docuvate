// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DOCUMENT_LIST_MAX_LIMIT, type DocumentListQuery } from '@docuvate/contracts';

import type { DocumentListQueryDto } from '../../../shared/presentation/dtos/documents.dto.js';
import { clampDocumentListLimit } from '../infrastructure/document-list-pagination.js';
import { parseFieldFiltersQuery } from './parse-field-filters-query.js';

export function parseDocumentListQuery(params: DocumentListQueryDto): DocumentListQuery {
  const limit = clampDocumentListLimit(params.limit);
  const cursor = params.cursor?.trim() ? params.cursor.trim() : undefined;

  return {
    q: params.q,
    status: params.status,
    tagId: params.tagId,
    tagIds: params.tags
      ? params.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
    recognizedFieldKey: params.recognizedFieldKey ?? params.fieldFilterKey,
    recognizedFieldValue: params.recognizedFieldValue ?? params.fieldFilterValue,
    fieldFilterKey: params.fieldFilterKey,
    fieldFilterValue: params.fieldFilterValue,
    fieldFilters: parseFieldFiltersQuery(params.fieldFilters),
    folderId: params.folderId,
    unfiled: params.unfiled ?? undefined,
    withoutNonInboxLabel: params.withoutNonInboxLabel ?? undefined,
    inbox: params.inbox ?? undefined,
    documentDateFrom: params.documentDateFrom,
    documentDateTo: params.documentDateTo,
    sort: params.sort,
    order: params.order,
    includeTagSuggestions: params.includeTagSuggestions ?? undefined,
    limit,
    cursor,
  };
}

export { DOCUMENT_LIST_MAX_LIMIT };
