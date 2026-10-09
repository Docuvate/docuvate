// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';
import type { DocumentListQueryDto } from '../../../shared/presentation/dtos/documents.dto.js';

export function parseDocumentListQuery(params: DocumentListQueryDto): DocumentListQuery {
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
    correspondentId: params.correspondentId,
    folderId: params.folderId,
    mappeId: params.mappeId,
    unfiled: params.unfiled ?? undefined,
    withoutNonInboxLabel: params.withoutNonInboxLabel ?? undefined,
    inbox: params.inbox ?? undefined,
    documentDateFrom: params.documentDateFrom,
    documentDateTo: params.documentDateTo,
    sort: params.sort,
    order: params.order,
  };
}
