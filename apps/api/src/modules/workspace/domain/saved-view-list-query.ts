// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';

import type { SavedDocumentViewEntity } from './workspace.types.js';

export function savedViewToDocumentListQuery(view: SavedDocumentViewEntity): DocumentListQuery {
  return {
    sort: view.sort,
    order: view.order,
    status: view.status ?? undefined,
    inbox: view.inbox ?? undefined,
    withoutNonInboxLabel: view.withoutNonInboxLabel ?? undefined,
    tagIds: view.tagIds.length > 0 ? view.tagIds : undefined,
    folderId: view.folderId ?? undefined,
    fieldFilters: view.fieldFilters.length > 0 ? view.fieldFilters : undefined,
    documentDateFrom: view.documentDateFrom ?? undefined,
    documentDateTo: view.documentDateTo ?? undefined,
    q: view.searchQuery.trim() || undefined,
  };
}
