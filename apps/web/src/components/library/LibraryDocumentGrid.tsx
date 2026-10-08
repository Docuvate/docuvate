import { type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DocumentDto } from '@docuvate/contracts';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { DocumentThumb } from './DocumentThumb';
import { documentDisplayDate } from './libraryDocumentUtils';
import {
  duplicateStackVersionLabel,
  showDuplicateStackBadge,
  showLegacyDuplicateHint,
} from './duplicateStackLabel';

interface LibraryDocumentGridProps {
  items: DocumentDto[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onContextMenu: (event: MouseEvent, documentId: string) => void;
}

export function LibraryDocumentGrid({
  items,
  selected,
  onToggleSelect,
  onContextMenu,
}: LibraryDocumentGridProps) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="doc-grid">
      {items.map((doc) => (
        <li
          key={doc.id}
          className={`doc-card${selected.has(doc.id) ? ' doc-card-selected' : ''}`}
          onContextMenu={(event) => onContextMenu(event, doc.id)}
        >
          <div className="doc-card-check">
            <input
              type="checkbox"
              checked={selected.has(doc.id)}
              onChange={() => onToggleSelect(doc.id)}
              aria-label={`${doc.title} auswählen`}
            />
          </div>
          <Link to={`/documents/${doc.id}`} className="doc-card-link">
            <DocumentThumb documentId={doc.id} mimeType={doc.mimeType} title={doc.title} />
            <div className="doc-card-body">
              <div className="doc-card-title-row">
                <h3 className="doc-card-title">{doc.title}</h3>
                {showDuplicateStackBadge(doc) ? (
                  <span className="stack-badge stack-badge-compact" title={t('library.stackVersionsTitle')}>
                    {duplicateStackVersionLabel(doc, t)}
                  </span>
                ) : null}
                {showLegacyDuplicateHint(doc) ? (
                  <span className="dup-badge" title={t('library.duplicateHintTitle')}>
                    Duplikat?
                  </span>
                ) : null}
              </div>
              <p className="muted doc-card-filename">{doc.filename}</p>
              <div className="doc-card-meta">
                <Badge status={doc.status} />
                <time dateTime={doc.documentDate ?? doc.updatedAt}>{documentDisplayDate(doc)}</time>
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
                      <span className="muted doc-card-tags-more" title={labelTags.slice(4).map((t) => t.name).join(', ')}>
                        +{labelTags.length - 4}
                      </span>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
