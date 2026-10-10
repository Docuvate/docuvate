// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { fetchDocumentContentBlob } from '../../lib/api';
import { isExtractionPending } from '../../lib/documentExtractionState';
import { fetchDocumentPreviewBuffer } from '../../lib/documentPreviewCache';
import { DocumentPreviewCard } from '../documents/DocumentPreviewCard';
import { ExtractionProgressBar } from '../documents/ExtractionProgressBar';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { duplicateStackVersionLabel, showDuplicateStackBadge } from './duplicateStackLabel';
import { documentDisplayDate, isImageMime, isPdfMime } from './libraryDocumentUtils';

interface LibraryFocusViewProps {
  items: DocumentDto[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onContextMenu: (event: MouseEvent, documentId: string) => void;
}

export function LibraryFocusView({
  items,
  selected,
  onToggleSelect,
  onContextMenu,
}: LibraryFocusViewProps) {
  const { t } = useTranslation();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ArrayBuffer | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const focused = useMemo(() => {
    if (items.length === 0) return null;
    if (focusId && items.some((d) => d.id === focusId)) {
      return items.find((d) => d.id === focusId) ?? items[0];
    }
    return items[0];
  }, [items, focusId]);

  const previewDocumentId = focused?.id;

  useEffect(() => {
    if (!previewDocumentId) {
      setPreviewData(null);
      setPreviewError(null);
      return;
    }
    let active = true;
    setPreviewError(null);

    void fetchDocumentPreviewBuffer(previewDocumentId, () =>
      fetchDocumentContentBlob(previewDocumentId)
    )
      .then((buffer) => {
        if (active) setPreviewData(buffer);
      })
      .catch(() => {
        if (active) {
          setPreviewData(null);
          setPreviewError('Vorschau konnte nicht geladen werden');
        }
      });

    return () => {
      active = false;
    };
  }, [previewDocumentId]);

  const onListKeyDown = useCallback(
    (event: KeyboardEvent, index: number) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const next =
        event.key === 'ArrowDown' ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
      const doc = items[next];
      if (doc) setFocusId(doc.id);
    },
    [items]
  );

  if (items.length === 0) {
    return null;
  }

  const isPdf = focused ? isPdfMime(focused.mimeType) : false;
  const isImage = focused ? isImageMime(focused.mimeType) : false;

  return (
    <div className="library-focus">
      <ul className="library-focus-list" role="listbox" aria-label={t('library.documentListAria')}>
        {items.map((doc, index) => (
          <li key={doc.id}>
            <div
              className={`library-focus-row${focused?.id === doc.id ? ' library-focus-row-active' : ''}`}
              onContextMenu={(event) => { onContextMenu(event, doc.id); }}
            >
              <input
                type="checkbox"
                checked={selected.has(doc.id)}
                onChange={() => { onToggleSelect(doc.id); }}
                aria-label={`${doc.title} auswählen`}
                onClick={(e) => { e.stopPropagation(); }}
              />
              <button
                type="button"
                className="library-focus-row-btn"
                role="option"
                aria-selected={focused?.id === doc.id}
                onClick={() => { setFocusId(doc.id); }}
                onKeyDown={(e) => { onListKeyDown(e, index); }}
              >
                <span className="library-focus-row-title" title={doc.title}>
                  {doc.title}
                  {showDuplicateStackBadge(doc) ? (
                    <span className="stack-badge stack-badge-compact">
                      {duplicateStackVersionLabel(doc, t)}
                    </span>
                  ) : null}
                </span>
                <span className="library-focus-row-filename muted" title={doc.filename}>
                  {doc.filename}
                </span>
                <span className="library-focus-row-meta">
                  {isExtractionPending(doc.status) ? (
                    <ExtractionProgressBar doc={doc} compact className="library-row-progress" />
                  ) : (
                    <Badge status={doc.status} />
                  )}
                  <span className="muted">{documentDisplayDate(doc)}</span>
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="library-focus-pane">
        {focused ? (
          <>
            <div className="library-focus-pane-head">
              <div>
                <h2 className="library-focus-pane-title" title={focused.title}>
                  {focused.title}
                </h2>
                <p className="muted library-focus-row-filename" title={focused.filename}>
                  {focused.filename}
                </p>
                {focused.tags.length > 0 ? (
                  <div className="tag-row">
                    {focused.tags.map((t) => (
                      <Chip
                        key={t.id}
                        label={t.name}
                        variant={t.isInbox ? 'inbox' : 'assigned'}
                        color={t.isInbox ? undefined : t.color}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              <Link to={`/documents/${focused.id}`} className="btn btn-secondary">
                {t('library.openDocumentDetails')}
              </Link>
            </div>
            {previewError ? (
              <p className="error" role="alert">
                {previewError}
              </p>
            ) : null}
            <div className="library-focus-preview">
              <DocumentPreviewCard
                doc={focused}
                previewData={previewData}
                isPdf={isPdf}
                isImage={isImage}
                fitWidth
                paginated={false}
                compact
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
