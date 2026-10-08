import { Fragment, useCallback, useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DocumentDto, DuplicateStackMemberDto } from '@docuvate/contracts';
import { deleteDocument, getDuplicateStack } from '../../lib/api';
import { isExtractionPending } from '../../lib/documentExtractionState';
import { ExtractionProgressBar } from '../documents/ExtractionProgressBar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DocumentLabelsCell } from './DocumentLabelsCell';
import {
  duplicateStackVersionLabel,
  showDuplicateStackBadge,
  showLegacyDuplicateHint,
} from './duplicateStackLabel';
import { setDocumentDragData } from '../../lib/documentDnD';
import { documentDisplayDate } from './libraryDocumentUtils';

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
}: LibraryDocumentTableProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [stackMembers, setStackMembers] = useState<Record<string, DuplicateStackMemberDto[]>>({});
  const [versionDeleteTarget, setVersionDeleteTarget] = useState<{
    primaryDocId: string;
    member: DuplicateStackMemberDto;
  } | null>(null);
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
      const next: Record<string, DuplicateStackMemberDto[]> = {};
      for (const id of Object.keys(prev)) {
        if (stackPrimaryIds.has(id)) {
          next[id] = prev[id]!;
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
        setStackMembers((prev) => {
          const copy = { ...prev };
          delete copy[doc.id];
          return copy;
        });
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
        setStackMembers((prev) => {
          const copy = { ...prev };
          delete copy[primaryDocId];
          return copy;
        });
      } else if (stack) {
        setStackMembers((prev) => ({ ...prev, [primaryDocId]: stack.members }));
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`library-table-wrap${hideFolderColumn ? ' library-table-wrap-hide-folder' : ''}`}
      >
      <table className="data-table library-table">
        <colgroup>
          <col className="library-col-expand" />
          <col className="library-col-check" />
          <col className="library-col-title" />
          {hideFolderColumn ? null : <col className="library-col-meta" />}
          <col className="library-col-labels" />
          <col className="library-col-status" />
          <col className="library-col-date" />
          <col className="library-col-action" />
        </colgroup>
        <thead>
          <tr>
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
              <button type="button" className="sort-btn" onClick={() => onSort('title')}>
                {t('library.colTitle')}
              </button>
            </th>
            {hideFolderColumn ? null : (
              <th className="library-col-meta">
                <span className="library-th-label">{t('library.colFolder')}</span>
              </th>
            )}
            <th className="library-col-labels">
              <span className="library-th-label">{t('library.colLabels')}</span>
            </th>
            <th className="library-col-status">
              <span className="library-th-label">{t('library.colStatus')}</span>
            </th>
            <th className="library-col-date">
              <button type="button" className="sort-btn" onClick={() => onSort('documentDate')}>
                {t('library.colDate')}
              </button>
            </th>
            <th className="library-col-action">
              <span className="library-th-label">{t('library.colAction')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((doc) => {
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
                <tr
                  className={rowClassName || undefined}
                  tabIndex={0}
                  aria-selected={rowSelected}
                  draggable={enableDocumentDrag ? true : undefined}
                  onDragStart={
                    enableDocumentDrag
                      ? (event) => {
                          if (event.dataTransfer) setDocumentDragData(event.dataTransfer, doc.id);
                        }
                      : undefined
                  }
                  onContextMenu={(event) => onContextMenu(event, doc.id)}
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
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(doc.id)}
                      onChange={() => onToggleSelect(doc.id)}
                      aria-label={`${doc.title} auswählen`}
                    />
                  </td>
                  <td className="library-col-title">
                    <div className="cell-title">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="library-title-link"
                        title={doc.title}
                      >
                        {doc.title}
                      </Link>
                      {stackLabel ? (
                        <button
                          type="button"
                          className="stack-badge"
                          title={t('library.stackVersionsTitle')}
                          onClick={() => onReviewStack(doc.id)}
                        >
                          {stackLabel}
                        </button>
                      ) : null}
                      {showLegacyDuplicateHint(doc) ? (
                        <span className="dup-badge" title={t('library.duplicateHintTitle')}>
                          {t('library.duplicateHintBadge')}
                        </span>
                      ) : null}
                    </div>
                    {doc.filename.trim() !== doc.title.trim() ? (
                      <div className="muted cell-sub" title={doc.filename}>
                        {doc.filename}
                      </div>
                    ) : null}
                    {doc.folder?.name &&
                    doc.folder.id !== suppressFolderFallbackForId ? (
                      <div
                        className="muted cell-sub library-title-folder-fallback"
                        title={doc.folder.name}
                      >
                        {doc.folder.name}
                      </div>
                    ) : null}
                    <div className="library-title-labels-fallback">
                      <DocumentLabelsCell tags={doc.tags} />
                    </div>
                    {doc.status !== 'ready' ? (
                      <div className="library-title-status-fallback">
                        {isExtractionPending(doc.status) ? (
                          <ExtractionProgressBar doc={doc} compact className="library-row-progress" />
                        ) : (
                          <Badge status={doc.status} />
                        )}
                      </div>
                    ) : null}
                  </td>
                  {hideFolderColumn ? null : (
                    <td className="library-col-meta" title={doc.folder?.name ?? ''}>
                      {doc.folder?.name ?? ''}
                    </td>
                  )}
                  <td className="library-col-labels">
                    <DocumentLabelsCell tags={doc.tags} />
                  </td>
                  <td className="library-col-status">
                    {doc.duplicateStack?.pendingReview ? (
                      <span className="badge badge-warn" title={t('library.reviewPendingTooltip')}>
                        {t('library.reviewPending')}
                      </span>
                    ) : isExtractionPending(doc.status) ? (
                      <ExtractionProgressBar doc={doc} compact className="library-row-progress" />
                    ) : (
                      <Badge status={doc.status} />
                    )}
                  </td>
                  <td className="library-col-date">{documentDisplayDate(doc)}</td>
                  <td className="library-col-action">
                    <div className="library-row-actions">
                      {hasStack ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="library-inline-action"
                          onClick={() => onReviewStack(doc.id)}
                        >
                          {t('library.stackReviewAction')}
                        </Button>
                      ) : (
                        <Link to={`/documents/${doc.id}`}>{t('library.contextOpen')}</Link>
                      )}
                      <button
                        type="button"
                        className="library-row-menu-btn"
                        aria-label={t('library.rowActionsAria', { title: doc.title })}
                        aria-haspopup="menu"
                        onClick={(event) => onRowMenu(event, doc.id)}
                      >
                        ⋯
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded && members.length > 0
                  ? members.map((member) => (
                      <tr key={`${doc.id}-${member.documentId}`} className="library-row-stack-version">
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
                              onClick={() => onReviewStack(doc.id, member.documentId)}
                            >
                              {t('library.stackCompareAction')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="library-inline-action library-inline-action-danger"
                              onClick={() =>
                                setVersionDeleteTarget({ primaryDocId: doc.id, member })
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

      <ConfirmDialog
        open={versionDeleteTarget != null}
        title="Duplikat löschen?"
        description={`„${versionDeleteTarget?.member.filename ?? 'Diese Datei'}“ wird unwiderruflich gelöscht. Der Stapel wird aktualisiert.`}
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        tone="danger"
        busy={deleteBusy}
        onCancel={() => setVersionDeleteTarget(null)}
        onConfirm={() => void deleteVersionFromRow()}
      />
    </>
  );
}
