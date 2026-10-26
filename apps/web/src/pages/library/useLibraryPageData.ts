// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentListQuery,
  DocumentStatus,
  FolderDto,
  LibraryTableColumnId,
  RecognizedFieldDefinitionDto,
  TagDto,
} from '@docuvate/contracts';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';

import {
  computeGroupedLibraryLabelSuggestions,
  filterGroupedSuggestionsToSelection,
} from '../../components/library/groupedLabelSuggestions';
import { useToastNotify } from '../../components/save/ToastProvider';
import {
  acceptDocumentTagSuggestion,
  bulkDocuments,
  getSavedDocumentView,
  listFolders,
  listRecognizedFields,
  listTags,
  removeDocumentTag,
  updateSavedDocumentView,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import {
  type DocumentFilterParseIssue,
  parseDocumentFilterQuery,
  resolveDocumentFilterFields,
  serializeDocumentFilterQuery,
} from '../../lib/documentFilterQuery';
import { documentListQueryKey } from '../../lib/documents/documentListQueryKey';
import {
  flattenDocumentPages,
  useDocumentsInfiniteQuery,
} from '../../lib/documents/useDocumentsInfiniteQuery';
import {
  documentListQueryWithFieldFilters,
  patchFieldFilter,
} from '../../lib/libraryFieldFilters';
import {
  type LibraryFilterMode,
  readLibraryFilterMode,
  writeLibraryFilterMode,
} from '../../lib/libraryFilterMode';
import {
  type LibraryViewMode,
  readLibraryViewMode,
  writeLibraryViewMode,
} from '../../lib/libraryViewMode';
import { childFolders } from '../../lib/ordnerTree';
import { applySavedViewToLibrary, buildSavedViewPayload } from '../../lib/savedViewState';
type SortField = NonNullable<DocumentListQuery['sort']>;

export type LibrarySelectionScope = 'none' | 'loaded' | 'all-matching';

export function useLibraryPageData(mode: 'all' | 'folder' | 'unassigned' | 'ordner-root') {
  const { t } = useTranslation();
  const { pushSuccess } = useToastNotify();
  const { folderId } = useParams<{ folderId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [folders, setFolders] = useState<FolderDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [recognizedFields, setRecognizedFields] = useState<RecognizedFieldDefinitionDto[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DocumentListQuery>({
    sort: 'updatedAt',
    order: 'desc',
  });
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionScope, setSelectionScope] = useState<LibrarySelectionScope>('none');
  const [bulkTagId, setBulkTagId] = useState('');
  const [bulkFolderId, setBulkFolderId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [groupedLabelBusy, setGroupedLabelBusy] = useState(false);
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() => readLibraryViewMode());
  const [filterMode, setFilterModeState] = useState<LibraryFilterMode>(() =>
    readLibraryFilterMode()
  );
  const [filterQueryText, setFilterQueryText] = useState('');
  const [filterParseIssues, setFilterParseIssues] = useState<DocumentFilterParseIssue[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<LibraryTableColumnId[]>([
    'title',
    'labels',
    'date',
    'status',
  ]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [activeViewName, setActiveViewName] = useState<string | null>(null);
  const urlHydratedRef = useRef(false);
  const filtersRef = useRef(filters);
  const queryRef = useRef(query);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const inboxTag = useMemo(() => tags.find((tag) => tag.isInbox), [tags]);

  const syncFiltersToUrl = useCallback(
    (nextFilters: DocumentListQuery, nextQuery: string, tagList: TagDto[]) => {
      if (mode !== 'all') return;
      const serialized = serializeDocumentFilterQuery(nextFilters, nextQuery, tagList);
      const next = new URLSearchParams(searchParams);
      next.delete('tags');
      next.delete('q');
      if (serialized.trim()) next.set('filter', serialized);
      else next.delete('filter');
      setSearchParams(next, { replace: true });
    },
    [mode, searchParams, setSearchParams]
  );

  const publishFilterState = useCallback(
    (merged: DocumentListQuery, nextQuery: string, tagList: TagDto[], syncUrl: boolean) => {
      setFilterQueryText(serializeDocumentFilterQuery(merged, nextQuery, tagList));
      if (syncUrl) syncFiltersToUrl(merged, nextQuery, tagList);
    },
    [syncFiltersToUrl]
  );

  const applyParsedFilter = useCallback(
    (
      parsed: ReturnType<typeof resolveDocumentFilterFields>,
      tagList: TagDto[],
      syncUrl: boolean,
      options?: { applyFreeText?: boolean }
    ) => {
      const { fields, issues } = parsed;
      setFilterParseIssues(issues);
      const nextQuery = fields.q ?? '';
      const merged: DocumentListQuery = {
        ...filtersRef.current,
        tagId: undefined,
        inbox: fields.inbox ?? undefined,
        tagIds: fields.tagIds,
        status: fields.status,
        withoutNonInboxLabel: fields.withoutNonInboxLabel ?? undefined,
      };
      setFilters(merged);
      const applyFreeText = options?.applyFreeText ?? true;
      if (applyFreeText) {
        setQuery(nextQuery);
        publishFilterState(merged, nextQuery, tagList, syncUrl);
      } else {
        publishFilterState(merged, queryRef.current, tagList, syncUrl);
      }
    },
    [publishFilterState]
  );

  const hydrateFromUrl = useCallback(
    (tagList: TagDto[]) => {
      if (mode !== 'all') return;
      const filterParam = searchParams.get('filter');
      const raw = filterParam ?? '';
      if (!raw.trim()) {
        urlHydratedRef.current = true;
        setFilterQueryText('');
        return;
      }
      const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(raw), tagList);
      applyParsedFilter(parsed, tagList, false, {
        applyFreeText: readLibraryFilterMode() !== 'ui',
      });
      urlHydratedRef.current = true;
    },
    [applyParsedFilter, mode, searchParams]
  );

  const loadTaxonomy = useCallback(async () => {
    const [tagRows, folderRows, fieldRows] = await Promise.all([
      listTags(),
      listFolders(),
      listRecognizedFields().catch(() => []),
    ]);
    setTags(tagRows);
    setFolders(folderRows);
    setRecognizedFields(fieldRows);
    return tagRows;
  }, []);

  const filterableFields = useMemo(
    () => recognizedFields.filter((field) => field.showInFilter),
    [recognizedFields]
  );

  useEffect(() => {
    void loadTaxonomy()
      .then((tagRows) => {
        if (!urlHydratedRef.current) hydrateFromUrl(tagRows);
      })
      .catch(() => undefined);
  }, [hydrateFromUrl, loadTaxonomy]);

  useEffect(() => {
    if (mode !== 'all' || tags.length === 0) return;
    const viewId = searchParams.get('view');
    if (viewId) {
      void getSavedDocumentView(viewId)
        .then((view) => {
          const applied = applySavedViewToLibrary(view, tags);
          setFilters(applied.filters);
          setQuery(applied.query);
          setViewMode(applied.viewMode);
          writeLibraryViewMode(applied.viewMode);
          setFilterModeState(applied.filterMode);
          writeLibraryFilterMode(applied.filterMode);
          setFilterQueryText(applied.filterQueryText);
          setVisibleColumns(applied.visibleColumns);
          setActiveViewId(view.id);
          setActiveViewName(view.name);
          urlHydratedRef.current = true;
        })
        .catch(() => undefined);
      return;
    }
    const filterParam = searchParams.get('filter');
    if (filterParam === null) return;
    if (!urlHydratedRef.current) return;
    const raw = filterParam;
    const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(raw), tags);
    applyParsedFilter(parsed, tags, false, { applyFreeText: filterMode !== 'ui' });
  }, [searchParams, tags, mode, applyParsedFilter, filterMode]);

  const listFilters = useMemo<DocumentListQuery | null>(() => {
    if (mode === 'ordner-root') return null;
    return documentListQueryWithFieldFilters({
      ...filters,
      q: query || undefined,
      inbox: mode === 'all' ? filters.inbox : undefined,
      folderId: mode === 'folder' ? folderId : undefined,
      unfiled: mode === 'unassigned' ? true : undefined,
      tagId: undefined,
      includeTagSuggestions: true,
    });
  }, [filters, query, mode, folderId]);

  const documentsQuery = useDocumentsInfiniteQuery(listFilters);
  const listQueryKey = useMemo(() => documentListQueryKey(listFilters), [listFilters]);
  const items = useMemo(
    () => flattenDocumentPages(documentsQuery.data?.pages),
    [documentsQuery.data?.pages]
  );
  const totalCount = documentsQuery.data?.pages[0]?.total ?? null;
  const loading = documentsQuery.isPending && items.length === 0;

  useEffect(() => {
    setSelected(new Set());
    setSelectionScope('none');
  }, [listQueryKey]);

  useEffect(() => {
    if (documentsQuery.error) {
      setError(formatUserFacingError(documentsQuery.error, 'errors.loadFailed'));
      return;
    }
    setError(null);
  }, [documentsQuery.error]);

  const load = useCallback(async () => {
    await documentsQuery.refetch();
  }, [documentsQuery]);

  useEffect(() => {
    if (selectionScope === 'all-matching') {
      return;
    }
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(items.map((d) => d.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [items, selectionScope]);

  const visibleSelectedCount = useMemo(() => {
    if (items.length === 0) return 0;
    const visible = new Set(items.map((d) => d.id));
    let count = 0;
    for (const id of selected) {
      if (visible.has(id)) count += 1;
    }
    return count;
  }, [items, selected]);

  useEffect(() => {
    const hasPending = items.some((d) => ['uploaded', 'queued', 'extracting'].includes(d.status));
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      void documentsQuery.refetch();
    }, 4000);
    return () => { window.clearInterval(timer); };
  }, [items, documentsQuery]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (mode === 'all') {
      syncFiltersToUrl(filters, query, tags);
      setFilterQueryText(serializeDocumentFilterQuery(filters, query, tags));
    }
    await load();
  }

  function patchFilters(patch: Partial<DocumentListQuery>, nextQuery = query) {
    const merged = { ...filters, ...patch, tagId: undefined };
    setFilters(merged);
    publishFilterState(merged, nextQuery, tags, mode === 'all');
  }

  function toggleFilter(patch: Partial<DocumentListQuery>) {
    patchFilters(patch);
  }

  function setFieldFilter(fieldKey: string, valueText: string) {
    const fieldFilters = patchFieldFilter(filters.fieldFilters, fieldKey, valueText);
    patchFilters({ fieldFilters, fieldFilterKey: undefined, fieldFilterValue: undefined });
  }

  function toggleLabelFilter(tagId: string) {
    const current = filters.tagIds ?? [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    const tagIds = next.length > 0 ? next : undefined;
    const merged = {
      ...filters,
      tagIds,
      inbox: undefined,
      tagId: undefined,
      withoutNonInboxLabel: undefined,
    };
    setFilters(merged);
    publishFilterState(merged, query, tags, mode === 'all');
  }

  function applyFilterQueryText(text: string) {
    setFilterQueryText(text);
    const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(text), tags);
    applyParsedFilter(parsed, tags, mode === 'all');
  }

  function setFilterMode(next: LibraryFilterMode) {
    setFilterModeState(next);
    writeLibraryFilterMode(next);
    if (next === 'query') {
      setFilterQueryText(serializeDocumentFilterQuery(filters, query, tags));
    }
  }

  function toggleSelect(id: string) {
    setSelectionScope('none');
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectForContextMenu(documentId: string) {
    setSelected((prev) => (prev.has(documentId) ? prev : new Set([documentId])));
  }

  function clearSelection() {
    setSelected(new Set());
    setSelectionScope('none');
  }

  function toggleSelectAll() {
    const loadedIds = items.map((d) => d.id);
    const allLoadedSelected =
      loadedIds.length > 0 && loadedIds.every((id) => selected.has(id));
    if (allLoadedSelected) {
      setSelected(new Set());
      setSelectionScope('none');
      return;
    }
    setSelected(new Set(loadedIds));
    setSelectionScope('loaded');
  }

  const fetchAllDocumentPages = useCallback(async () => {
    let hasMore = documentsQuery.hasNextPage;
    let data = documentsQuery.data;
    while (hasMore) {
      const result = await documentsQuery.fetchNextPage();
      data = result.data;
      hasMore = result.hasNextPage;
    }
    return data;
  }, [documentsQuery]);

  const selectAllMatchingDocuments = useCallback(async () => {
    const data = await fetchAllDocumentPages();
    const loaded = flattenDocumentPages(data?.pages);
    setSelected(new Set(loaded.map((doc) => doc.id)));
    setSelectionScope('all-matching');
  }, [fetchAllDocumentPages]);

  const resolveBulkDocumentIds = useCallback(async (): Promise<string[]> => {
    if (selectionScope === 'all-matching') {
      const data = await fetchAllDocumentPages();
      const loaded = flattenDocumentPages(data?.pages);
      return loaded.map((doc) => doc.id);
    }
    return [...selected];
  }, [fetchAllDocumentPages, selected, selectionScope]);

  const groupedLabelSuggestions = useMemo(() => {
    const scope =
      selected.size > 0 ? items.filter((doc) => selected.has(doc.id)) : items;
    const groups = computeGroupedLibraryLabelSuggestions(scope);
    return filterGroupedSuggestionsToSelection(groups, selected);
  }, [items, selected]);

  async function acceptGroupedLabelSuggestion(tagId: string, documentIds: string[]) {
    if (documentIds.length === 0) {
      return;
    }
    setGroupedLabelBusy(true);
    setError(null);
    try {
      for (const documentId of documentIds) {
        await acceptDocumentTagSuggestion(documentId, tagId);
      }
      await load();
      pushSuccess(t('library.groupedLabelApplied', { count: documentIds.length }), {
        undo: () => {
          void Promise.all(
            documentIds.map((documentId) => removeDocumentTag(documentId, tagId))
          ).then(() => load());
        },
      });
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.actionFailed'));
    } finally {
      setGroupedLabelBusy(false);
    }
  }

  async function runBulk(action: Parameters<typeof bulkDocuments>[0]['bulk']) {
    if (selected.size === 0 && selectionScope !== 'all-matching') return;
    const selectedIds = await resolveBulkDocumentIds();
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      await bulkDocuments({ ids: selectedIds, bulk: action });
      setSelected(new Set());
      setSelectionScope('none');
      await load();
      if (action.action === 'addTag' || action.action === 'removeTag') {
        const tagId = action.tagId;
        const reverseAction =
          action.action === 'addTag'
            ? ({ action: 'removeTag', tagId } as const)
            : ({ action: 'addTag', tagId } as const);
        pushSuccess(t('library.bulkLabelChanged'), {
          undo: () => {
            void bulkDocuments({ ids: selectedIds, bulk: reverseAction }).then(() => load());
          },
        });
      }
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.actionFailed'));
    } finally {
      setBulkBusy(false);
    }
  }

  function setSort(field: SortField) {
    setFilters((prev) => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  }

  function onViewModeChange(next: LibraryViewMode) {
    setViewMode(next);
    writeLibraryViewMode(next);
  }

  const statusOptions: DocumentStatus[] = ['ready', 'extracting', 'queued', 'uploaded', 'failed'];

  const pageTitle = useMemo(() => {
    if (mode === 'all' && filters.inbox) return t('library.titleInbox');
    if (mode === 'folder') {
      return folders.find((f) => f.id === folderId)?.name ?? t('common.folder');
    }
    if (mode === 'unassigned') return t('filesystem.withoutFolder');
    if (mode === 'ordner-root') return t('filesystem.title');
    return t('library.titleDocuments');
  }, [mode, filters.inbox, folderId, folders, t]);

  const childFoldersForView = useMemo(() => {
    if (mode !== 'folder' || !folderId) return [];
    return childFolders(folders, folderId);
  }, [mode, folderId, folders]);

  const activeLabelNames = (filters.tagIds ?? [])
    .map((id) => tags.find((tag) => tag.id === id)?.name)
    .filter(Boolean);

  const hasDocuments = items.length > 0;

  async function updateActiveSavedView() {
    if (!activeViewId) return;
    const payload = buildSavedViewPayload(activeViewName ?? t('library.titleDocuments'), {
      filters,
      query,
      tags,
      viewMode,
      filterMode,
      visibleColumns,
    });
    await updateSavedDocumentView(activeViewId, {
      searchQuery: payload.searchQuery,
      sort: payload.sort,
      order: payload.order,
      viewMode: payload.viewMode,
      filterMode: payload.filterMode,
      tagIds: payload.tagIds,
      status: payload.status,
      inbox: payload.inbox,
      withoutNonInboxLabel: payload.withoutNonInboxLabel,
      fieldFilters: payload.fieldFilters,
      documentDateFrom: payload.documentDateFrom,
      documentDateTo: payload.documentDateTo,
      visibleColumns: payload.visibleColumns,
    });
  }

  return {
    items,
    folders,
    childFoldersForView,
    tags,
    recognizedFields,
    filterableFields,
    query,
    setQuery,
    filters,
    loading,
    error,
    selected,
    visibleSelectedCount,
    bulkTagId,
    setBulkTagId,
    bulkFolderId,
    setBulkFolderId,
    bulkBusy,
    viewMode,
    inboxTag,
    statusOptions,
    pageTitle,
    activeLabelNames,
    hasDocuments,
    filterMode,
    setFilterMode,
    filterQueryText,
    setFilterQueryText,
    applyFilterQueryText,
    filterParseIssues,
    onSearch,
    toggleFilter,
    setFieldFilter,
    toggleLabelFilter,
    toggleSelect,
    toggleSelectAll,
    selectForContextMenu,
    clearSelection,
    runBulk,
    setSort,
    onViewModeChange,
    load,
    loadTaxonomy,
    activeFolderId: mode === 'folder' ? folderId : undefined,
    visibleColumns,
    activeViewId,
    activeViewName,
    updateActiveSavedView,
    groupedLabelSuggestions,
    groupedLabelBusy,
    acceptGroupedLabelSuggestion,
    totalCount,
    hasNextPage: documentsQuery.hasNextPage,
    fetchNextPage: documentsQuery.fetchNextPage,
    isFetchingNextPage: documentsQuery.isFetchingNextPage,
    selectionScope,
    selectAllMatchingDocuments,
    bulkSelectedCount: selected.size,
  };
}
