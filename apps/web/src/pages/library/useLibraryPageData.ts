import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type {
  DocumentDto,
  DocumentListQuery,
  DocumentStatus,
  FolderDto,
  MappeDto,
  TagDto,
} from '@docuvate/contracts';
import { formatUserFacingError } from '../../lib/apiErrors';
import {
  bulkDocuments,
  listDocuments,
  listFolders,
  listMappen,
  listTags,
} from '../../lib/api';
import {
  parseDocumentFilterQuery,
  resolveDocumentFilterFields,
  serializeDocumentFilterQuery,
  type DocumentFilterParseIssue,
} from '../../lib/documentFilterQuery';
import {
  readLibraryFilterMode,
  writeLibraryFilterMode,
  type LibraryFilterMode,
} from '../../lib/libraryFilterMode';
import {
  readLibraryViewMode,
  writeLibraryViewMode,
  type LibraryViewMode,
} from '../../lib/libraryViewMode';
type SortField = NonNullable<DocumentListQuery['sort']>;

export function useLibraryPageData(mode: 'all' | 'folder' | 'mappe' | 'ordner-root') {
  const { t, i18n } = useTranslation();
  const { folderId, mappeId } = useParams<{ folderId?: string; mappeId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<DocumentDto[]>([]);
  const [folders, setFolders] = useState<FolderDto[]>([]);
  const [mappen, setMappen] = useState<MappeDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DocumentListQuery>({
    sort: 'updatedAt',
    order: 'desc',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTagId, setBulkTagId] = useState('');
  const [bulkFolderId, setBulkFolderId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [viewMode, setViewMode] = useState<LibraryViewMode>(() => readLibraryViewMode());
  const [filterMode, setFilterModeState] = useState<LibraryFilterMode>(() => readLibraryFilterMode());
  const [filterQueryText, setFilterQueryText] = useState('');
  const [filterParseIssues, setFilterParseIssues] = useState<DocumentFilterParseIssue[]>([]);
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
        inbox: fields.inbox || undefined,
        tagIds: fields.tagIds,
        status: fields.status,
        withoutNonInboxLabel: fields.withoutNonInboxLabel || undefined,
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
    const [tagRows, folderRows, mappeRows] = await Promise.all([
      listTags(),
      listFolders(),
      listMappen(),
    ]);
    setTags(tagRows);
    setFolders(folderRows);
    setMappen(mappeRows);
    return tagRows;
  }, []);

  useEffect(() => {
    void loadTaxonomy()
      .then((tagRows) => {
        if (!urlHydratedRef.current) hydrateFromUrl(tagRows);
      })
      .catch(() => undefined);
  }, [hydrateFromUrl, loadTaxonomy]);

  useEffect(() => {
    if (mode !== 'all' || tags.length === 0) return;
    const filterParam = searchParams.get('filter');
    if (filterParam === null) return;
    if (!urlHydratedRef.current) return;
    const raw = filterParam;
    const parsed = resolveDocumentFilterFields(parseDocumentFilterQuery(raw), tags);
    applyParsedFilter(parsed, tags, false, { applyFreeText: filterMode !== 'ui' });
  }, [searchParams, tags, mode, applyParsedFilter, filterMode]);

  const listFilters = useMemo<DocumentListQuery | null>(() => {
    if (mode === 'ordner-root') return null;
    return {
      ...filters,
      q: query || undefined,
      inbox: mode === 'all' ? filters.inbox : undefined,
      folderId: mode === 'folder' ? folderId : undefined,
      mappeId: mode === 'mappe' ? mappeId : undefined,
      tagId: undefined,
    };
  }, [filters, query, mode, folderId, mappeId]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!listFilters) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const docs = await listDocuments(listFilters);
      setItems(docs);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.loadFailed'));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [listFilters, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
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
  }, [items]);

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
    const hasPending = items.some((d) =>
      ['uploaded', 'queued', 'extracting'].includes(d.status)
    );
    if (!hasPending) return;
    const timer = window.setInterval(() => void load({ silent: true }), 4000);
    return () => window.clearInterval(timer);
  }, [items, load]);

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
  }

  function toggleSelectAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((d) => d.id)));
  }

  async function runBulk(action: Parameters<typeof bulkDocuments>[0]['bulk']) {
    if (selected.size === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      await bulkDocuments({ ids: [...selected], bulk: action });
      setSelected(new Set());
      await load();
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

  const statusOptions: DocumentStatus[] = [
    'ready',
    'extracting',
    'queued',
    'uploaded',
    'failed',
  ];

  const pageTitle = useMemo(() => {
    if (mode === 'all' && filters.inbox) return t('library.titleInbox');
    if (mode === 'folder') {
      return folders.find((f) => f.id === folderId)?.name ?? t('common.folder');
    }
    if (mode === 'mappe') {
      return mappen.find((m) => m.id === mappeId)?.name ?? t('common.folder');
    }
    if (mode === 'ordner-root') return t('filesystem.title');
    return t('library.titleDocuments');
  }, [mode, filters.inbox, folderId, mappeId, folders, mappen, t, i18n.language]);

  const mappeSubtitle = useMemo(() => {
    if (mode !== 'mappe' || !mappeId) return null;
    const m = mappen.find((x) => x.id === mappeId);
    if (!m) return null;
    const parts: string[] = [];
    if (m.documentCount != null) {
      parts.push(t('library.mappeDocCount', { count: m.documentCount }));
    }
    if (m.folderCount != null) {
      parts.push(t('library.mappeFolderCount', { count: m.folderCount }));
    }
    return parts.join(' · ');
  }, [mode, mappeId, mappen, t, i18n.language]);

  const activeLabelNames = (filters.tagIds ?? [])
    .map((id) => tags.find((tag) => tag.id === id)?.name)
    .filter(Boolean);

  const hasDocuments = items.length > 0;

  return {
    items,
    folders,
    mappen,
    mappeSubtitle,
    tags,
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
  };
}
