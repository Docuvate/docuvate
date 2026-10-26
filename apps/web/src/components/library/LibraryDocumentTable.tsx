// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentDto,
  DuplicateStackMemberDto,
  LibraryTableColumnId,
} from '@docuvate/contracts';
import { ExternalLink, ScanLine } from 'lucide-react';
import {
  Fragment,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { deleteDocument, getDuplicateStack } from '../../lib/api';
import { extractionFailureMessage, isExtractionPending } from '../../lib/documentExtractionState';
import { useFilesystemCompactDocs } from '../../lib/useFilesystemCompactDocs';
import { useNarrowTopbar } from '../../lib/useNarrowTopbar';
import { ExtractionProgressBar } from '../documents/ExtractionProgressBar';
import { DocumentDraggableTableRow } from '../ordner/DocumentDraggableSurface';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';
import { DocumentLabelsCell } from './DocumentLabelsCell';
import {
  duplicateStackVersionLabel,
  showDuplicateStackBadge,
  showLegacyDuplicateHint,
} from './duplicateStackLabel';
import { DuplicateStackQuickReview } from './DuplicateStackQuickReview';
import { documentDisplayDateParts } from './libraryDocumentUtils';
import { useLibraryDocumentVirtualizer } from './useLibraryDocumentVirtualizer';

type SortField = 'title' | 'documentDate' | 'updatedAt';

interface LibraryDocumentTableProps {
  items: DocumentDto[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (field: SortField) => void;
  onRefresh: () => void;
  onContextMenu: (event: MouseEvent, documentId: string) => void;
  onRowMenu: (event: MouseEvent, documentId: string) => void;
  onContextMenuKeyboard: (event: KeyboardEvent, documentId: string) => void;
  contextMenuDocumentId?: string | null;
  onReviewStack: (primaryId: string, versionId?: string | null) => void;
  enableDocumentDrag?: boolean;
  hideFolderColumn?: boolean;
  /** When set, hide redundant folder line under title for docs in this folder. */
  suppressFolderFallbackForId?: string;
  visibleColumns?: LibraryTableColumnId[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  listScrollStorageKey?: string;
}

function showColumn(
  columns: LibraryTableColumnId[] | undefined,
  id: LibraryTableColumnId
): boolean {
  return !columns || columns.includes(id);
}

export function LibraryDocumentTable({
  items,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onRefresh,
  onContextMenu,
  onRowMenu,
  onContextMenuKeyboard,
  contextMenuDocumentId,
  onReviewStack,
  enableDocumentDrag,
  hideFolderColumn = false,
  suppressFolderFallbackForId,
  visibleColumns,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  listScrollStorageKey,
}: LibraryDocumentTableProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('de') ? 'de-DE' : 'en-US';
  const renderDocumentDate = (doc: DocumentDto) => {
    const parts = documentDisplayDateParts(doc, dateLocale);
    return (
      <>
        {parts.text}
        {parts.isUploadFallback ? (
          <span className="library-date-fallback muted" title={t('library.dateUploadFallback')}>
            {' '}
            *
          </span>
        ) : null}
      </>
    );
  };
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [stackMembers, setStackMembers] = useState<
    Partial<Record<string, DuplicateStackMemberDto[]>>
  >({});
  const [versionDeleteTarget, setVersionDeleteTarget] = useState<{
    primaryDocId: string;
    member: DuplicateStackMemberDto;
  } | null>(null);
  const [primaryDeleteTarget, setPrimaryDeleteTarget] = useState<{
    doc: DocumentDto;
    versionCount: number;
  } | null>(null);
  const [deleteAllStackVersions, setDeleteAllStackVersions] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const stackPrimaryIds = new Set(
      items.filter((doc) => showDuplicateStackBadge(doc)).map((doc) => doc.id)
    );
    setExpandedIds((prev) => {
      const next = new Set([...prev].filter((id) => stackPrimaryIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setStackMembers((prev) => {
      let changed = false;
      const next: Partial<Record<string, DuplicateStackMemberDto[]>> = {};
      for (const id of Object.keys(prev)) {
        if (stackPrimaryIds.has(id)) {
          const members = prev[id];
          if (members !== undefined) {
            next[id] = members;
          }
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    const expandedWithStack = items.filter(
      (doc) => expandedIds.has(doc.id) && showDuplicateStackBadge(doc)
    );
    if (expandedWithStack.length === 0) return;

    void Promise.all(
      expandedWithStack.map(async (doc) => {
        const stack = await getDuplicateStack(doc.id);
        return { docId: doc.id, members: stack?.members ?? [] };
      })
    ).then((results) => {
      if (cancelled) return;
      setStackMembers((prev) => {
        const next = { ...prev };
        for (const { docId, members } of results) {
          next[docId] = members;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [items, expandedIds]);

  const toggleExpanded = useCallback(
    async (doc: DocumentDto) => {
      const next = new Set(expandedIds);
      if (next.has(doc.id)) {
        next.delete(doc.id);
        setExpandedIds(next);
        return;
      }
      next.add(doc.id);
      setExpandedIds(next);
      const stack = await getDuplicateStack(doc.id);
      if (stack) {
        setStackMembers((prev) => ({ ...prev, [doc.id]: stack.members }));
      } else {
        setStackMembers((prev) =>
          Object.fromEntries(Object.entries(prev).filter(([key]) => key !== doc.id))
        );
      }
    },
    [expandedIds]
  );

  const deleteVersionFromRow = async () => {
    if (!versionDeleteTarget) return;
    const { primaryDocId, member } = versionDeleteTarget;
    setDeleteBusy(true);
    try {
      await deleteDocument(member.documentId);
      setVersionDeleteTarget(null);
      onRefresh();
      const stack = await getDuplicateStack(primaryDocId);
      const versions = stack?.members.filter((m) => m.role === 'version') ?? [];
      if (versions.length === 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(primaryDocId);
          return next;
        });
        setStackMembers((prev) =>
          Object.fromEntries(Object.entries(prev).filter(([key]) => key !== primaryDocId))
        );
      } else if (stack) {
        setStackMembers((prev) => ({ ...prev, [primaryDocId]: stack.members }));
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const deletePrimaryFromRow = async () => {
    if (!primaryDeleteTarget) return;
    const { doc, versionCount } = primaryDeleteTarget;
    setDeleteBusy(true);
    try {
      if (deleteAllStackVersions && versionCount > 0) {
        const stack = await getDuplicateStack(doc.id);
        const memberIds =
          stack?.members.map((member) => member.documentId) ?? [doc.id];
        for (const id of memberIds) {
          await deleteDocument(id);
        }
      } else {
        await deleteDocument(doc.id);
      }
      setPrimaryDeleteTarget(null);
      setDeleteAllStackVersions(false);
      onRefresh();
    } finally {
      setDeleteBusy(false);
    }
  };

  const openPrimaryDelete = async (doc: DocumentDto) => {
    let versionCount = doc.duplicateStack?.versionCount ?? 0;
    try {
      const stack = await getDuplicateStack(doc.id);
      versionCount = stack?.members.filter((m) => m.role === 'version').length ?? versionCount;
    } catch {
      // Fall back to list summary when stack details are unavailable.
    }
    setDeleteAllStackVersions(versionCount > 0);
    setPrimaryDeleteTarget({ doc, versionCount });
  };

  const narrowTopbar = useNarrowTopbar();
  const filesystemCompactDocs = useFilesystemCompactDocs(hideFolderColumn);
  const mobileStack = narrowTopbar || filesystemCompactDocs;
  const { parentRef: virtualScrollRef, virtualizer } = useLibraryDocumentVirtualizer({
    count: items.length,
    estimateSize: mobileStack ? 136 : 58,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    scrollStorageKey: listScrollStorageKey,
  });
  const virtualRows = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return null;
  }

  const versionDeleteDialog = (
    <Dialog
      open={versionDeleteTarget != null}
      busy={deleteBusy}
      onCancel={() => { setVersionDeleteTarget(null); }}
      aria-labelledby="library-version-delete-title"
      aria-describedby="library-version-delete-desc"
      data-testid="library-version-delete-dialog"
    >
      <DialogHeader
        title={t('library.duplicateDeleteTitle')}
        titleId="library-version-delete-title"
      />
      <DialogBody>
        <p id="library-version-delete-desc">
          {t('library.duplicateDeleteDescription', {
            filename:
              versionDeleteTarget?.member.filename ?? t('library.duplicateDeleteFallbackFile'),
          })}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          disabled={deleteBusy}
          onClick={() => { setVersionDeleteTarget(null); }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={deleteBusy}
          onClick={() => void deleteVersionFromRow()}
        >
          {t('common.deletePermanently')}
        </Button>
      </DialogFooter>
    </Dialog>
  );

  const primaryDeleteDialog = (
    <Dialog
      open={primaryDeleteTarget != null}
      busy={deleteBusy}
      onCancel={() => {
        setPrimaryDeleteTarget(null);
        setDeleteAllStackVersions(false);
      }}
      aria-labelledby="library-primary-delete-title"
      aria-describedby="library-primary-delete-desc"
      data-testid="library-primary-delete-dialog"
    >
      <DialogHeader title={t('library.stackPrimaryDeleteTitle')} titleId="library-primary-delete-title" />
      <DialogBody>
        <p id="library-primary-delete-desc">
          {t('library.stackPrimaryDeleteDescription', {
            filename: primaryDeleteTarget?.doc.filename ?? t('library.duplicateDeleteFallbackFile'),
          })}
        </p>
        {primaryDeleteTarget && primaryDeleteTarget.versionCount > 0 ? (
          <label className="checkbox-row library-primary-delete-checkbox">
            <input
              type="checkbox"
              checked={deleteAllStackVersions}
              onChange={(e) => { setDeleteAllStackVersions(e.target.checked); }}
            />
            <span>{t('library.stackPrimaryDeleteAllVersions')}</span>
          </label>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          disabled={deleteBusy}
          onClick={() => {
            setPrimaryDeleteTarget(null);
            setDeleteAllStackVersions(false);
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={deleteBusy}
          onClick={() => void deletePrimaryFromRow()}
        >
          {primaryDeleteTarget && deleteAllStackVersions && primaryDeleteTarget.versionCount > 0
            ? t('library.stackPrimaryDeleteConfirmWithVersions', {
                count: primaryDeleteTarget.versionCount + 1,
              })
            : t('common.deletePermanently')}
        </Button>
      </DialogFooter>
    </Dialog>
  );

  const deleteDialogs = (
    <>
      {versionDeleteDialog}
      {primaryDeleteDialog}
    </>
  );

  if (mobileStack) {
    return (
      <>
        <div
          className={`library-table-wrap library-table-wrap--stack${hideFolderColumn ? ' library-table-wrap-hide-folder' : ''}`}
        >
          <div
            ref={virtualScrollRef}
            className="library-doc-list-scroll"
            data-testid="library-doc-virtual-scroll"
          >
            <ul className="library-doc-stack-list" data-testid="library-doc-stack-list">
              <li className="library-doc-stack-select-all">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={onToggleSelectAll}
                  aria-label={t('library.selectAll')}
                />
                <span>{t('library.selectAll')}</span>
              </li>
            </ul>
            <div
              className="library-doc-stack-virtual-host"
              style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
              role="list"
            >
              {virtualRows.map((virtualRow) => {
                const doc = items[virtualRow.index];
                const stackLabel = duplicateStackVersionLabel(doc, t);
              const hasStack = showDuplicateStackBadge(doc);
              const rowSelected = selected.has(doc.id);
              const rowContextOpen = contextMenuDocumentId === doc.id;
              const rowClassName = [
                'library-doc-stack-item',
                rowSelected ? 'library-row-selected' : '',
                rowContextOpen ? 'library-row-context-open' : '',
              ]
                .filter(Boolean)
                .join(' ');

                return (
                  <div
                    key={doc.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={rowClassName}
                    role="listitem"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${String(virtualRow.start)}px)`,
                    }}
                    onContextMenu={(event) => { onContextMenu(event, doc.id); }}
                  >
                    <article className="library-doc-stack-item-inner">
                    <div className="library-doc-stack-primary">
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => { onToggleSelect(doc.id); }}
                        onKeyDown={(event) => {
                          if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                            onContextMenuKeyboard(event, doc.id);
                          }
                        }}
                        aria-label={`${doc.title} auswählen`}
                      />
                      <div className="library-doc-stack-text">
                        <div className="library-doc-stack-title">
                          <Link to={`/documents/${doc.id}`} className="library-title-link">
                            {doc.title}
                          </Link>
                          {stackLabel ? (
                            <DuplicateStackQuickReview
                              primaryDocumentId={doc.id}
                              label={stackLabel}
                              className="stack-badge"
                              onChanged={onRefresh}
                              onOpenFullReview={onReviewStack}
                            />
                          ) : null}
                          {showLegacyDuplicateHint(doc) ? (
                            <span className="dup-badge" title={t('library.duplicateHintTitle')}>
                              {t('library.duplicateHintBadge')}
                            </span>
                          ) : null}
                        </div>
                        {doc.filename.trim() !== doc.title.trim() ? (
                          <div className="muted library-doc-stack-filename" title={doc.filename}>
                            {doc.filename}
                          </div>
                        ) : null}
                        {doc.ingestSource === 'scanner_sftp' ? (
                          <span className="library-title-ingest-meta">
                            <ScanLine
                              className="library-title-ingest-icon"
                              size={14}
                              aria-label={t('documents.ingestSourceScanner')}
                            />
                            {t('documents.ingestSourceScanner')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="library-doc-stack-meta">
                      <div className="library-doc-stack-meta-main">
                        <DocumentLabelsCell document={doc} onRefresh={onRefresh} />
                        {doc.duplicateStack?.pendingReview ? (
                          <span className="badge badge-warn">{t('library.reviewPending')}</span>
                        ) : isExtractionPending(doc.status) ? (
                          <ExtractionProgressBar
                            doc={doc}
                            compact
                            className="library-row-progress"
                          />
                        ) : (
                          <Badge status={doc.status} />
                        )}
                        <span className="library-doc-stack-date">{renderDocumentDate(doc)}</span>
                      </div>
                      <div className="library-doc-stack-meta-actions">
                        {hasStack ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              className="library-inline-action library-doc-stack-action-btn"
                              onClick={() => { onReviewStack(doc.id); }}
                            >
                              {t('library.stackReviewAction')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="library-inline-action library-inline-action-danger library-doc-stack-action-btn"
                              data-testid="library-stack-primary-delete"
                              onClick={() => void openPrimaryDelete(doc)}
                            >
                              {t('library.stackDeleteAction')}
                            </Button>
                          </>
                        ) : (
                          <Link
                            to={`/documents/${doc.id}`}
                            className="library-open-doc-btn library-doc-stack-action-btn"
                            aria-label={t('library.contextOpen')}
                            title={t('library.contextOpen')}
                          >
                            <ExternalLink size={20} strokeWidth={1.75} aria-hidden />
                          </Link>
                        )}
                        <button
                          type="button"
                          className="library-row-menu-btn library-doc-stack-menu-btn library-doc-stack-action-btn"
                          aria-label={t('library.rowActionsAria', { title: doc.title })}
                          aria-haspopup="menu"
                          onClick={(event) => { onRowMenu(event, doc.id); }}
                        >
                          ⋯
                        </button>
                      </div>
                    </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {deleteDialogs}
      </>
    );
  }

  const showFolderCol = !hideFolderColumn && showColumn(visibleColumns, 'folder');
  const showLabelsCol = showColumn(visibleColumns, 'labels');
  const showStatusCol = showColumn(visibleColumns, 'status');
  const showDateCol = showColumn(visibleColumns, 'date');

  return (
    <>
      <div
        className={`library-table-wrap${hideFolderColumn ? ' library-table-wrap-hide-folder' : ''}`}
      >
        <div
          ref={virtualScrollRef}
          className="library-doc-list-scroll library-table-scroll"
          data-testid="library-doc-virtual-scroll"
        >
        <table className="data-table library-table library-table-virtualized">
          <colgroup>
            <col className="library-col-expand" />
            <col className="library-col-check" />
            <col className="library-col-title" />
            {showFolderCol ? <col className="library-col-meta" /> : null}
            {showLabelsCol ? <col className="library-col-labels" /> : null}
            {showStatusCol ? <col className="library-col-status" /> : null}
            {showDateCol ? <col className="library-col-date" /> : null}
            <col className="library-col-action" />
          </colgroup>
          <thead>
            <tr className="library-table-virtual-header-row">
              <th className="library-col-expand" aria-hidden="true" />
              <th className="library-col-check">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={onToggleSelectAll}
                  aria-label={t('library.selectAll')}
                />
              </th>
              <th className="library-col-title">
                <button type="button" className="sort-btn" onClick={() => { onSort('title'); }}>
                  {t('library.colTitle')}
                </button>
              </th>
              {showFolderCol ? (
                <th className="library-col-meta">
                  <span className="library-th-label">{t('library.colFolder')}</span>
                </th>
              ) : null}
              {showLabelsCol ? (
                <th className="library-col-labels">
                  <span className="library-th-label">{t('library.colLabels')}</span>
                </th>
              ) : null}
              {showStatusCol ? (
                <th className="library-col-status">
                  <span className="library-th-label">{t('library.colStatus')}</span>
                </th>
              ) : null}
              {showDateCol ? (
                <th className="library-col-date">
                  <button type="button" className="sort-btn" onClick={() => { onSort('documentDate'); }}>
                    {t('library.colDate')}
                  </button>
                </th>
              ) : null}
              <th className="library-col-action">
                <span className="sr-only">{t('library.colAction')}</span>
              </th>
            </tr>
          </thead>
          <tbody
            className="library-table-virtual-body"
            style={{ height: virtualizer.getTotalSize(), position: 'relative', display: 'block' }}
          >
            {virtualRows.map((virtualRow) => {
              const doc = items[virtualRow.index];
              const stackLabel = duplicateStackVersionLabel(doc, t);
              const hasStack = showDuplicateStackBadge(doc);
              const expanded = expandedIds.has(doc.id);
              const members = stackMembers[doc.id]?.filter((m) => m.role === 'version') ?? [];

              const rowSelected = selected.has(doc.id);
              const rowContextOpen = contextMenuDocumentId === doc.id;
              const rowClassName = [
                hasStack ? 'library-row-stack' : '',
                rowSelected ? 'library-row-selected' : '',
                rowContextOpen ? 'library-row-context-open' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <Fragment key={doc.id}>
                  <DocumentDraggableTableRow
                    documentId={doc.id}
                    dragEnabled={enableDocumentDrag}
                    className={['library-table-virtual-row', rowClassName].filter(Boolean).join(' ')}
                    data-index={virtualRow.index}
                    style={{
                      width: '100%',
                      position: 'absolute',
                      top: 0,
                      transform: `translateY(${String(virtualRow.start)}px)`,
                    }}
                    tabIndex={0}
                    aria-selected={rowSelected}
                    onContextMenu={(event) => { onContextMenu(event, doc.id); }}
                    onKeyDown={(event) => {
                      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                        onContextMenuKeyboard(event, doc.id);
                      }
                    }}
                  >
                    <td className="library-col-expand">
                      {hasStack ? (
                        <button
                          type="button"
                          className="stack-toggle"
                          aria-expanded={expanded}
                          aria-label={
                            expanded ? t('library.stackCollapseAria') : t('library.stackExpandAria')
                          }
                          onClick={() => void toggleExpanded(doc)}
                        >
                          {expanded ? '▾' : '▸'}
                        </button>
                      ) : null}
                    </td>
                    <td className="library-col-check">
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => { onToggleSelect(doc.id); }}
                        aria-label={`${doc.title} auswählen`}
                      />
                    </td>
                    <td className="library-col-title">
                      <div className="cell-title">
                        <div className="cell-title-row">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="library-title-link cell-title-text"
                            title={doc.title}
                          >
                            {doc.title}
                          </Link>
                          <div className="cell-title-badges">
                            {stackLabel ? (
                              <DuplicateStackQuickReview
                                primaryDocumentId={doc.id}
                                label={stackLabel}
                                className="stack-badge"
                                onChanged={onRefresh}
                                onOpenFullReview={onReviewStack}
                              />
                            ) : null}
                            {showLegacyDuplicateHint(doc) ? (
                              <span className="dup-badge" title={t('library.duplicateHintTitle')}>
                                {t('library.duplicateHintBadge')}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {doc.ingestSource === 'scanner_sftp' ? (
                          <span className="library-title-ingest-meta">
                            <ScanLine
                              className="library-title-ingest-icon"
                              size={14}
                              aria-label={t('documents.ingestSourceScanner')}
                            />
                            {t('documents.ingestSourceScanner')}
                          </span>
                        ) : null}
                      </div>
                      {doc.filename.trim() !== doc.title.trim() ? (
                        <div className="muted cell-sub" title={doc.filename}>
                          {doc.filename}
                        </div>
                      ) : null}
                      {doc.folder?.name && doc.folder.id !== suppressFolderFallbackForId ? (
                        <div
                          className="muted cell-sub library-title-folder-fallback"
                          title={doc.folder.name}
                        >
                          {doc.folder.name}
                        </div>
                      ) : null}
                      {!showColumn(visibleColumns, 'status') && doc.status !== 'ready' ? (
                        <div className="library-title-status-fallback">
                          {isExtractionPending(doc.status) ? (
                            <ExtractionProgressBar
                              doc={doc}
                              compact
                              className="library-row-progress"
                            />
                          ) : (
                            <Badge status={doc.status} />
                          )}
                        </div>
                      ) : null}
                    </td>
                    {showFolderCol ? (
                      <td className="library-col-meta" title={doc.folder?.name ?? ''}>
                        {doc.folder?.name ?? ''}
                      </td>
                    ) : null}
                    {showLabelsCol ? (
                      <td className="library-col-labels">
                        <DocumentLabelsCell document={doc} onRefresh={onRefresh} />
                      </td>
                    ) : null}
                    {showStatusCol ? (
                      <td className="library-col-status">
                        {doc.duplicateStack?.pendingReview ? (
                          <span
                            className="badge badge-warn"
                            title={t('library.reviewPendingTooltip')}
                          >
                            {t('library.reviewPending')}
                          </span>
                        ) : isExtractionPending(doc.status) ? (
                          <ExtractionProgressBar
                            doc={doc}
                            compact
                            className="library-row-progress"
                          />
                        ) : (
                          <span
                            title={
                              doc.status === 'failed'
                                ? extractionFailureMessage(doc)
                                : undefined
                            }
                          >
                            <Badge status={doc.status} />
                          </span>
                        )}
                      </td>
                    ) : null}
                    {showDateCol ? (
                      <td className="library-col-date">{renderDocumentDate(doc)}</td>
                    ) : null}
                    <td className="library-col-action">
                      <div className="library-row-actions">
                        {hasStack ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              className="library-inline-action"
                              onClick={() => { onReviewStack(doc.id); }}
                            >
                              {t('library.stackReviewAction')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="library-inline-action library-inline-action-danger"
                              data-testid="library-stack-primary-delete"
                              onClick={() => void openPrimaryDelete(doc)}
                            >
                              {t('library.stackDeleteAction')}
                            </Button>
                          </>
                        ) : (
                          <Link
                            to={`/documents/${doc.id}`}
                            className="library-open-doc-btn"
                            aria-label={t('library.contextOpen')}
                            title={t('library.contextOpen')}
                          >
                            <ExternalLink size={20} strokeWidth={1.75} aria-hidden />
                          </Link>
                        )}
                        <button
                          type="button"
                          className="library-row-menu-btn"
                          aria-label={t('library.rowActionsAria', { title: doc.title })}
                          aria-haspopup="menu"
                          onClick={(event) => { onRowMenu(event, doc.id); }}
                        >
                          ⋯
                        </button>
                      </div>
                    </td>
                  </DocumentDraggableTableRow>
                  {expanded && members.length > 0
                    ? members.map((member) => (
                        <tr
                          key={`${doc.id}-${member.documentId}`}
                          className="library-row-stack-version"
                        >
                          <td />
                          <td />
                          <td colSpan={hideFolderColumn ? 5 : 6}>
                            <div className="stack-version-row">
                              <span className="muted">{t('library.stackVersionLabel')}</span>
                              <strong>{member.title}</strong>
                              <span className="muted cell-sub">{member.filename}</span>
                              <Badge status={member.status} />
                              <Button
                                type="button"
                                variant="ghost"
                                className="library-inline-action"
                                onClick={() => { onReviewStack(doc.id, member.documentId); }}
                              >
                                {t('library.stackCompareAction')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="library-inline-action library-inline-action-danger"
                                onClick={() => { setVersionDeleteTarget({ primaryDocId: doc.id, member }); }
                                }
                              >
                                {t('library.stackDeleteAction')}
                              </Button>
                            </div>
                          </td>
                          <td />
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {deleteDialogs}
    </>
  );
}
