// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDocumentPreviewDto } from '@docuvate/contracts';
import { FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import {
  recommendationDocumentTitle,
  shouldShowRecommendationFilename,
} from './labelRecDocumentDisplay';
import { allDocumentsSelected } from './labelRecDocumentSelection';

const MAX_VISIBLE = 3;

interface Props {
  documents: LabelRecommendationDocumentPreviewDto[];
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
  exclusionHint?: boolean;
}

function formatDocumentDate(
  doc: LabelRecommendationDocumentPreviewDto,
  locale: string
): string | null {
  const raw = doc.documentDate?.trim();
  if (!raw) {
    return null;
  }
  const parsed = Date.parse(`${raw}T12:00:00.000Z`);
  if (Number.isNaN(parsed)) {
    return raw;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(parsed));
}

function formatSimilarityPct(similarity: number | undefined, locale: string): string | null {
  if (similarity == null || !Number.isFinite(similarity)) {
    return null;
  }
  const pct = Math.round(similarity * 100);
  return new Intl.NumberFormat(locale).format(pct);
}

interface DocumentRowProps {
  doc: LabelRecommendationDocumentPreviewDto;
  selected: boolean;
  selectable: boolean;
  onToggle: (documentId: string, checked: boolean) => void;
}

function DocumentRow(props: DocumentRowProps) {
  const { doc, selected, selectable, onToggle } = props;
  const { t, i18n } = useTranslation();
  const dateLabel = formatDocumentDate(doc, i18n.language);
  const similarityPct = formatSimilarityPct(doc.similarity, i18n.language);

  return (
    <li
      className={`label-rec-doc-row${selectable && !selected ? ' is-unselected' : ''}`}
    >
      {selectable ? (
        <input
          type="checkbox"
          className="label-rec-doc-checkbox"
          checked={selected}
          aria-label={t('labelRecommendations.documentSelectAria', {
            title: recommendationDocumentTitle(doc),
          })}
          onChange={(event) => {
            onToggle(doc.id, event.target.checked);
          }}
        />
      ) : (
        <FileText size={14} aria-hidden className="label-rec-doc-icon" />
      )}
      <div className="label-rec-doc-main">
        <Link to={routes.document(doc.id)} className="label-rec-doc-link">
          {recommendationDocumentTitle(doc)}
        </Link>
        {shouldShowRecommendationFilename(doc) ? (
          <span className="label-rec-doc-filename muted">{doc.filename}</span>
        ) : null}
        {dateLabel || similarityPct != null ? (
          <span className="label-rec-doc-meta muted">
            {dateLabel}
            {dateLabel && similarityPct != null ? ' · ' : null}
            {similarityPct != null
              ? t('labelRecommendations.documentSimilarityPct', { pct: similarityPct })
              : null}
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function LabelRecommendationDocuments(props: Props) {
  const { documents, selectedIds, onSelectedIdsChange, exclusionHint = false } = props;
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const selectable = documents.length > 1;
  const visible = useMemo(
    () => (expanded ? documents : documents.slice(0, MAX_VISIBLE)),
    [documents, expanded]
  );
  const overflow = documents.length - MAX_VISIBLE;
  const allSelected = allDocumentsSelected(selectedIds, documents);

  if (documents.length === 0) {
    return null;
  }

  const toggleAll = () => {
    if (allSelected) {
      onSelectedIdsChange(new Set());
      return;
    }
    onSelectedIdsChange(new Set(documents.map((doc) => doc.id)));
  };

  const toggleOne = (documentId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(documentId);
    } else {
      next.delete(documentId);
    }
    onSelectedIdsChange(next);
  };

  return (
    <div className="label-rec-doc-panel">
      {selectable ? (
        <div className="label-rec-doc-toolbar">
          <Button type="button" variant="ghost" className="label-rec-doc-toggle-all" onClick={toggleAll}>
            {allSelected
              ? t('labelRecommendations.deselectAllDocuments')
              : t('labelRecommendations.selectAllDocuments')}
          </Button>
        </div>
      ) : null}
      <ul className="label-rec-doc-list" aria-label={t('labelRecommendations.documentsAria')}>
        {visible.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            selected={selectedIds.has(doc.id)}
            selectable={selectable}
            onToggle={toggleOne}
          />
        ))}
      </ul>
      {!expanded && overflow > 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="label-rec-doc-expand"
          onClick={() => { setExpanded(true); }}
        >
          {t('labelRecommendations.moreDocuments', { count: overflow })}
        </Button>
      ) : null}
      {exclusionHint && selectable ? (
        <p className="muted label-rec-doc-exclusion-hint">{t('labelRecommendations.exclusionHint')}</p>
      ) : null}
    </div>
  );
}
