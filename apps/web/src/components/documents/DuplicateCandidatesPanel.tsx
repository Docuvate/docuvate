// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DuplicateCandidateDto } from '@docuvate/contracts';
import { dismissDuplicateCandidate, listDuplicateCandidates } from '../../lib/api';
import { Button } from '../ui/Button';

interface DuplicateCandidatesPanelProps {
  documentId: string;
}

export function DuplicateCandidatesPanel({ documentId }: DuplicateCandidatesPanelProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<DuplicateCandidateDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listDuplicateCandidates(documentId));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="duplicate-panel" aria-label={t('documents.duplicatesAria')}>
      <h2>{t('library.possibleDuplicates')}</h2>
      <p className="muted">{t('documents.duplicatesLead')}</p>
      <ul className="duplicate-list">
        {items.map((item) => (
          <li key={item.id} className="duplicate-row">
            <div>
              <Link to={`/documents/${item.candidateDocumentId}`}>{item.candidateTitle}</Link>
              <span className="muted cell-sub">
                {item.candidateFilename} · {Math.round(item.similarity * 100)} % ·{' '}
                {item.source === 'hash'
                  ? t('documents.duplicateSourceHash')
                  : t('documents.duplicateSourceEmbedding')}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void dismissDuplicateCandidate(documentId, item.candidateDocumentId).then(load);
              }}
            >
              {t('documents.duplicateDismiss')}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
