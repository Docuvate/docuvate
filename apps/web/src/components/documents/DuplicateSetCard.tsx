// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateSetDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { archiveDuplicateSet, dismissDuplicateSet } from '../../lib/api';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';

interface DuplicateSetCardProps {
  set: DuplicateSetDto;
  onResolved: () => void;
}

export function DuplicateSetCard({ set, onResolved }: DuplicateSetCardProps) {
  const { t } = useTranslation();
  return (
    <article className="duplicate-set-card">
      <header className="duplicate-set-card-header">
        <h3>{t('documents.duplicateSetTitle', { count: set.documents.length })}</h3>
        <span className="muted">
          {set.bulkArchiveEligible
            ? t('documents.duplicateSetHashIdentical')
            : t('documents.duplicateSetSimilarity', { percent: set.similarityPercent })}
        </span>
      </header>
      <ul className="duplicate-set-doc-list">
        {set.documents.map((doc, index) => (
          <li key={doc.documentId}>
            <Link to={routes.document(doc.documentId)}>
              {doc.title || doc.filename}
            </Link>
            <span className="muted cell-sub">
              {doc.filename}
              {index === 0 ? ` · ${t('documents.duplicateSetNewest')}` : ''}
            </span>
          </li>
        ))}
      </ul>
      {!set.bulkArchiveEligible ? (
        <p className="muted settings-hint">{t('documents.duplicateSetReviewPairsHint')}</p>
      ) : null}
      <div className="duplicate-set-actions">
        {set.bulkArchiveEligible ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              void archiveDuplicateSet(set.setId).then(onResolved);
            }}
          >
            {t('documents.duplicateSetArchiveRest')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void dismissDuplicateSet(set.setId).then(onResolved);
          }}
        >
          {t('documents.duplicateSetNotDuplicate')}
        </Button>
      </div>
    </article>
  );
}
