// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentListQuery,
  DocumentSortField,
  DocumentStatus,
  SortOrder,
} from '@docuvate/contracts';

export function buildDocumentListQuery(input: {
  q?: string;
  status?: DocumentStatus;
  tagId?: string;
  tags?: string;
  recognizedFieldKey?: string;
  recognizedFieldValue?: string;
  fieldFilterKey?: string;
  fieldFilterValue?: string;
  folderId?: string;
  unfiled?: string;
  inbox?: string;
  sort?: DocumentSortField;
  order?: SortOrder;
}): DocumentListQuery {
  const tagIds = input.tags
    ? input.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return {
    q: input.q,
    status: input.status,
    tagId: input.tagId,
    tagIds,
    recognizedFieldKey: input.recognizedFieldKey,
    recognizedFieldValue: input.recognizedFieldValue,
    fieldFilterKey: input.fieldFilterKey,
    fieldFilterValue: input.fieldFilterValue,
    folderId: input.folderId,
    unfiled: input.unfiled === 'true' || input.unfiled === '1',
    inbox: input.inbox === 'true' || input.inbox === '1',
    sort: input.sort,
    order: input.order,
  };
}
