// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { ScanLine } from 'lucide-react';
import { type MouseEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { DocumentDraggableGridItem } from '../ordner/DocumentDraggableSurface';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { DocumentThumb } from './DocumentThumb';
import {
  duplicateStackVersionLabel,
  showDuplicateStackBadge,
  showLegacyDuplicateHint,
} from './duplicateStackLabel';
import { DuplicateStackQuickReview } from './DuplicateStackQuickReview';
import { documentDisplayDate } from './libraryDocumentUtils';
import { useLibraryDocumentVirtualizer } from './useLibraryDocumentVirtualizer';

interface LibraryDocumentGridProps {
  items: DocumentDto[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onContextMenu: (event: MouseEvent, documentId: string) => void;
  onRefresh?: () => void;
  onReviewStack?: (primaryId: string, versionId?: string | null) => void;
  enableDocumentDrag?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  listScrollStorageKey?: string;
}

export function LibraryDocumentGrid({
  items,
  selected,
  onToggleSelect,
  onContextMenu,
  onRefresh,
  onReviewStack,
  enableDocumentDrag,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  listScrollStorageKey,
}: LibraryDocumentGridProps) {
  const { t, i18n } = useTranslation();
  const { parentRef, virtualizer } = useLibraryDocumentVirtualizer({
    count: items.length,
    estimateSize: 228,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    scrollStorageKey: listScrollStorageKey,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const gridStyle = useMemo(
    () => ({
      height: virtualizer.getTotalSize(),
      position: 'relative' as const,
    }),
    [virtualizer]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className="library-doc-list-scroll library-doc-grid-scroll"
      data-testid="library-doc-virtual-scroll"
    >
      <ul className="doc-grid doc-grid-virtual" style={gridStyle}>
      {virtualRows.map((virtualRow) => {
        const doc = items[virtualRow.index];
        return (
        <DocumentDraggableGridItem
          key={doc.id}
          documentId={doc.id}
          dragEnabled={enableDocumentDrag}
          className={`doc-card${selected.has(doc.id) ? ' doc-card-selected' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${String(virtualRow.start)}px)`,
          }}
          onContextMenu={(event) => { onContextMenu(event, doc.id); }}
        >
          <div className="doc-card-check">
            <input
              type="checkbox"
              checked={selected.has(doc.id)}
              onChange={() => { onToggleSelect(doc.id); }}
              aria-label={`${doc.title} auswählen`}
            />
          </div>
          <Link to={`/documents/${doc.id}`} className="doc-card-link">
            <DocumentThumb
              documentId={doc.id}
              mimeType={doc.mimeType}
              title={doc.title}
              formatBadge={doc.formatBadge}
              previewAvailable={doc.previewAvailable}
            />
            <div className="doc-card-body">
              <div className="doc-card-title-row">
                <h3 className="doc-card-title">{doc.title}</h3>
                {showDuplicateStackBadge(doc) && duplicateStackVersionLabel(doc, t) ? (
                  <DuplicateStackQuickReview
                    primaryDocumentId={doc.id}
                    label={duplicateStackVersionLabel(doc, t) ?? ''}
                    className="stack-badge stack-badge-compact"
                    onChanged={() => { onRefresh?.(); }}
                    onOpenFullReview={onReviewStack}
                  />
                ) : null}
                {showLegacyDuplicateHint(doc) ? (
                  <span className="dup-badge" title={t('library.duplicateHintTitle')}>
                    {t('library.duplicateHintBadge')}
                  </span>
                ) : null}
              </div>
              <p className="muted doc-card-filename">
                {doc.filename}
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
              </p>
              <div className="doc-card-meta">
                <Badge status={doc.status} />
                <time dateTime={doc.documentDate ?? doc.updatedAt}>
                  {documentDisplayDate(doc, i18n.language)}
                </time>
              </div>
              {(() => {
                const labelTags = doc.tags.filter((tag) => !tag.isInbox);
                if (labelTags.length === 0) return null;
                return (
                  <div className="tag-row doc-card-tags">
                    {labelTags.slice(0, 4).map((t) => (
                      <Chip key={t.id} label={t.name} variant="assigned" color={t.color} />
                    ))}
                    {labelTags.length > 4 ? (
                      <span
                        className="muted doc-card-tags-more"
                        title={labelTags
                          .slice(4)
                          .map((t) => t.name)
                          .join(', ')}
                      >
                        +{labelTags.length - 4}
                      </span>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          </Link>
        </DocumentDraggableGridItem>
        );
      })}
    </ul>
    </div>
  );
}
