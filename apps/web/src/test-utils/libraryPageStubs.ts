// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { RefObject } from 'react';

import type { useLibraryDocumentContextMenu } from '../pages/library/useLibraryDocumentContextMenu';
import type { useLibraryPageData } from '../pages/library/useLibraryPageData';

export type LibraryPageDataStub = ReturnType<typeof useLibraryPageData>;
export type LibraryPageContextStub = ReturnType<typeof useLibraryDocumentContextMenu>;

const stubFetchNextPage: LibraryPageDataStub['fetchNextPage'] = () => {
  return Promise.reject(new Error('fetchNextPage not implemented in library page stub'));
};

export function createLibraryPageDataStub(
  overrides: Partial<LibraryPageDataStub> = {}
): LibraryPageDataStub {
  return {
    items: [],
    folders: [],
    childFoldersForView: [],
    tags: [],
    recognizedFields: [],
    filterableFields: [],
    query: '',
    setQuery: () => undefined,
    filters: { sort: 'updatedAt', order: 'desc' },
    loading: false,
    error: null,
    selected: new Set<string>(),
    visibleSelectedCount: 0,
    bulkTagId: '',
    setBulkTagId: () => undefined,
    bulkFolderId: '',
    setBulkFolderId: () => undefined,
    bulkBusy: false,
    viewMode: 'klassisch',
    inboxTag: undefined,
    statusOptions: [],
    pageTitle: '',
    activeLabelNames: [],
    hasDocuments: false,
    filterMode: 'ui',
    setFilterMode: () => undefined,
    filterQueryText: '',
    setFilterQueryText: () => undefined,
    applyFilterQueryText: () => undefined,
    filterParseIssues: [],
    onSearch: (e) => {
      e.preventDefault();
      return Promise.resolve();
    },
    toggleFilter: () => undefined,
    setFieldFilter: () => undefined,
    toggleLabelFilter: () => undefined,
    toggleSelect: () => undefined,
    toggleSelectAll: () => undefined,
    selectForContextMenu: () => undefined,
    clearSelection: () => undefined,
    runBulk: () => Promise.resolve(),
    setSort: () => undefined,
    onViewModeChange: () => undefined,
    load: () => Promise.resolve(),
    loadTaxonomy: () => Promise.resolve([]),
    activeFolderId: undefined,
    visibleColumns: ['title', 'labels', 'date', 'status'],
    activeViewId: null,
    activeViewName: null,
    updateActiveSavedView: () => Promise.resolve(),
    groupedLabelSuggestions: [],
    groupedLabelBusy: false,
    acceptGroupedLabelSuggestion: () => Promise.resolve(),
    totalCount: null,
    hasNextPage: false,
    fetchNextPage: stubFetchNextPage,
    isFetchingNextPage: false,
    selectionScope: 'none',
    selectAllMatchingDocuments: async () => undefined,
    bulkSelectedCount: 0,
    ...overrides,
  };
}

const emptyAnchorRef: RefObject<HTMLElement | null> = { current: null };

export function createLibraryPageContextStub(
  overrides: Partial<LibraryPageContextStub> = {}
): LibraryPageContextStub {
  return {
    contextMenu: null,
    contextMenuTitle: '',
    contextMenuItems: [],
    contextMenuAnchorRef: emptyAnchorRef,
    closeContextMenu: () => undefined,
    openDocumentContextMenu: () => undefined,
    openDocumentContextMenuFromRowAction: () => undefined,
    openDocumentContextMenuFromKeyboard: () => undefined,
    stackReview: null,
    setStackReview: () => undefined,
    bulkDeleteConfirmCount: null,
    cancelBulkDeleteConfirm: () => undefined,
    confirmBulkDelete: () => Promise.resolve(),
    requestBulkDelete: () => undefined,
    ...overrides,
  };
}
