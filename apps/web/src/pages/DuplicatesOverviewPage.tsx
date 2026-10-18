// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateSetDto } from '@docuvate/contracts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DuplicateSetReviewCard } from '../components/documents/DuplicateSetReviewCard';
import { listDuplicateSets } from '../lib/api';

export function DuplicatesOverviewPage() {
  const { t } = useTranslation();
  const [sets, setSets] = useState<DuplicateSetDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSets(await listDuplicateSets());
    } catch {
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page duplicates-overview-page" data-testid="duplicates-overview-page">
      <header className="page-header">
        <h1>{t('documents.duplicateQueueTitle')}</h1>
        <p className="muted">{t('documents.duplicateQueueLead')}</p>
      </header>
      {loading ? <p className="muted">{t('documents.duplicateQueueLoading')}</p> : null}
      {!loading && sets.length === 0 ? (
        <p className="muted">{t('documents.duplicateQueueEmpty')}</p>
      ) : null}
      {!loading && sets.length > 0 ? (
        <div className="duplicate-set-list">
          {sets.map((set) => (
            <DuplicateSetReviewCard
              key={set.setId}
              set={set}
              onResolved={() => {
                void load();
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
