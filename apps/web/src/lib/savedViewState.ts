// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CreateSavedDocumentViewRequest,
  DocumentListQuery,
  LibraryTableColumnId,
  SavedDocumentViewDto,
  TagDto,
} from '@docuvate/contracts';

import { serializeDocumentFilterQuery } from './documentFilterQuery';
import type { LibraryFilterMode } from './libraryFilterMode';
import type { LibraryViewMode } from './libraryViewMode';

export function buildSavedViewPayload(
  name: string,
  options: {
    filters: DocumentListQuery;
    query: string;
    tags: TagDto[];
    viewMode: LibraryViewMode;
    filterMode: LibraryFilterMode;
    visibility?: 'private' | 'shared';
    pinnedSidebar?: boolean;
    visibleColumns?: LibraryTableColumnId[];
  }
): CreateSavedDocumentViewRequest {
  return {
    name,
    visibility: options.visibility ?? 'private',
    searchQuery: (options.query || (options.filters.q ?? '')).trim(),
    sort: options.filters.sort ?? 'updatedAt',
    order: options.filters.order ?? 'desc',
    viewMode: options.viewMode,
    filterMode: options.filterMode,
    listScope: 'all',
    tagIds: options.filters.tagIds ?? (options.filters.tagId ? [options.filters.tagId] : []),
    status: options.filters.status ?? null,
    inbox: options.filters.inbox ?? null,
    withoutNonInboxLabel: options.filters.withoutNonInboxLabel ?? null,
    folderId: options.filters.folderId ?? null,
    mappeId: options.filters.mappeId ?? null,
    correspondentId: options.filters.correspondentId ?? null,
    documentDateFrom: options.filters.documentDateFrom ?? null,
    documentDateTo: options.filters.documentDateTo ?? null,
    pinnedSidebar: options.pinnedSidebar ?? false,
    visibleColumns: options.visibleColumns ?? ['title', 'labels', 'date', 'status'],
  };
}

export function applySavedViewToLibrary(
  view: SavedDocumentViewDto,
  tags: TagDto[]
): {
  filters: DocumentListQuery;
  query: string;
  viewMode: LibraryViewMode;
  filterMode: LibraryFilterMode;
  filterQueryText: string;
  visibleColumns: LibraryTableColumnId[];
} {
  const filters: DocumentListQuery = {
    sort: view.sort,
    order: view.order,
    status: view.status ?? undefined,
    inbox: view.inbox ?? undefined,
    withoutNonInboxLabel: view.withoutNonInboxLabel ?? undefined,
    tagIds: view.tagIds.length > 0 ? view.tagIds : undefined,
    folderId: view.folderId ?? undefined,
    mappeId: view.mappeId ?? undefined,
    correspondentId: view.correspondentId ?? undefined,
    documentDateFrom: view.documentDateFrom ?? undefined,
    documentDateTo: view.documentDateTo ?? undefined,
  };
  const query = view.searchQuery;
  return {
    filters,
    query,
    viewMode: view.viewMode,
    filterMode: view.filterMode,
    filterQueryText: serializeDocumentFilterQuery(filters, query, tags),
    visibleColumns: view.visibleColumns,
  };
}

export function savedViewToListQuery(view: SavedDocumentViewDto): DocumentListQuery {
  return {
    sort: view.sort,
    order: view.order,
    status: view.status ?? undefined,
    inbox: view.inbox ?? undefined,
    withoutNonInboxLabel: view.withoutNonInboxLabel ?? undefined,
    tagIds: view.tagIds.length > 0 ? view.tagIds : undefined,
    folderId: view.folderId ?? undefined,
    mappeId: view.mappeId ?? undefined,
    correspondentId: view.correspondentId ?? undefined,
    documentDateFrom: view.documentDateFrom ?? undefined,
    documentDateTo: view.documentDateTo ?? undefined,
    q: view.searchQuery.trim() || undefined,
  };
}
