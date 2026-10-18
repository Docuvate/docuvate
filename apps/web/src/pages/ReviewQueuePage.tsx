// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentReviewQueueItemDto } from '@docuvate/contracts';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ReviewWizardView } from '../components/review/ReviewWizardView';
import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  acceptDocumentReviewHighConfidenceBatch,
  archiveHashIdenticalDuplicateSets,
  listDocumentReviewQueue,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { routes } from '../lib/routes';

export function ReviewQueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pushSuccess, pushError } = useToastNotify();
  const [items, setItems] = useState<DocumentReviewQueueItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchBusy, setBatchBusy] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDocumentReviewQueue();
      setItems(res.items);
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.loadFailed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pushError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onBatchHighConfidence() {
    setBatchBusy(true);
    try {
      const result = await acceptDocumentReviewHighConfidenceBatch(0.9);
      pushSuccess(
        t('reviewQueue.batchSuccess', {
          docs: result.documentsProcessed,
          labels: result.acceptedLabels,
          fields: result.acceptedFields,
        })
      );
      await load();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBatchBusy(false);
    }
  }

  const showWizard = !loading && items.length > 0;

  return (
    <div className="page review-queue-page" data-ux="page">
      <header className="page-header review-queue-header">
        <div>
          <h1 data-ux="page-title">{t('reviewQueue.title')}</h1>
          <p className="muted">{t('reviewQueue.lead')}</p>
        </div>
        <div className="review-queue-header-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={batchBusy || loading}
            onClick={() => { setArchiveConfirmOpen(true); }}
          >
            {t('reviewQueue.archiveHashIdenticalDuplicates')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={batchBusy || loading || items.length === 0}
            onClick={() => void onBatchHighConfidence()}
          >
            {t('reviewQueue.batchHighConfidence')}
          </Button>
          {showWizard ? (
            <Button type="button" variant="ghost" onClick={() => { navigate(routes.home); }}>
              {t('reviewWizard.exit')}
            </Button>
          ) : null}
        </div>
      </header>

      {loading ? <p className="muted">{t('reviewQueue.loading')}</p> : null}

      {!loading && items.length === 0 ? (
        <Card className="review-queue-done-card">
          <div className="review-queue-done-icon" aria-hidden="true">
            <Check size={28} strokeWidth={2} />
          </div>
          <h2>{t('reviewWizard.allDoneTitle')}</h2>
          <p className="muted">{t('reviewWizard.allDoneLead')}</p>
          <div className="review-queue-done-actions">
            <Button type="button" variant="primary" onClick={() => { navigate(routes.home); }}>
              {t('reviewWizard.backHome')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { navigate(routes.documents); }}>
              {t('reviewWizard.uploadDocuments')}
            </Button>
          </div>
        </Card>
      ) : null}

      {showWizard ? (
        <ReviewWizardView items={items} batchBusy={batchBusy} onReload={load} />
      ) : null}

      <ConfirmDialog
        open={archiveConfirmOpen}
        title={t('reviewQueue.archiveHashIdenticalConfirmTitle')}
        description={t('reviewQueue.archiveHashIdenticalConfirmBody')}
        confirmLabel={t('reviewQueue.archiveHashIdenticalDuplicates')}
        onCancel={() => { setArchiveConfirmOpen(false); }}
        onConfirm={() => {
          setArchiveConfirmOpen(false);
          setBatchBusy(true);
          void archiveHashIdenticalDuplicateSets()
            .then((result) => {
              pushSuccess(
                t('reviewQueue.archiveHashIdenticalSuccess', { count: result.setsArchived })
              );
              return load();
            })
            .catch((err: unknown) => {
              pushError(formatUserFacingError(err, 'errors.generic'));
            })
            .finally(() => {
              setBatchBusy(false);
            });
        }}
      />
    </div>
  );
}
