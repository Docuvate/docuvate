// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateSetDto } from '@docuvate/contracts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { listDuplicateSets } from '../../lib/api';
import { routes } from '../../lib/routes';
import { DuplicateSetCard } from './DuplicateSetCard';

interface DuplicateCandidatesPanelProps {
  documentId: string;
}

export function DuplicateCandidatesPanel({ documentId }: DuplicateCandidatesPanelProps) {
  const { t } = useTranslation();
  const [sets, setSets] = useState<DuplicateSetDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSets(await listDuplicateSets(documentId));
    } catch {
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;
  if (sets.length === 0) return null;

  return (
    <section className="duplicate-panel" aria-label={t('documents.duplicatesAria')}>
      <div className="duplicate-panel-head">
        <h2>{t('library.possibleDuplicates')}</h2>
        <Link className="duplicate-panel-queue-link" to={routes.duplicates}>
          {t('documents.duplicateQueueLink')}
        </Link>
      </div>
      <p className="muted">{t('documents.duplicatesLead')}</p>
      <div className="duplicate-set-list">
        {sets.map((set) => (
          <DuplicateSetCard
            key={set.setId}
            set={set}
            onResolved={() => {
              void load();
            }}
          />
        ))}
      </div>
    </section>
  );
}
