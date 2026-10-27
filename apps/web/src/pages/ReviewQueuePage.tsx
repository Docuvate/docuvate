// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check } from 'lucide-react';
import { useCallback, useState } from 'react';
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
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { flattenCursorPages } from '../lib/pagination/useCursorInfiniteQuery';
import { useDocumentReviewQueueInfiniteQuery } from '../lib/review/useDocumentReviewQueueInfiniteQuery';
import { routes } from '../lib/routes';

export function ReviewQueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pushSuccess, pushError } = useToastNotify();
  const [batchBusy, setBatchBusy] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const {
    data,
    isLoading: loading,
    isError: loadError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useDocumentReviewQueueInfiniteQuery();
  const items = flattenCursorPages(data?.pages);

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

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
      await reload();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBatchBusy(false);
    }
  }

  const showWizard = !loading && !loadError && items.length > 0;

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
      {loadError ? (
        <div className="review-queue-load-error" role="alert">
          <p className="error">{t('errors.loadFailed')}</p>
          <Button type="button" variant="secondary" onClick={() => void reload()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      {!loading && !loadError && items.length === 0 ? (
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
        <>
          <ReviewWizardView items={items} batchBusy={batchBusy} onReload={reload} />
          {hasNextPage ? (
            <div className="review-queue-load-more">
              <Button
                type="button"
                variant="secondary"
                disabled={isFetchingNextPage}
                onClick={() => {
                  void fetchNextPage();
                }}
              >
                {isFetchingNextPage ? t('common.loading') : t('ui.pagination.nextPage')}
              </Button>
            </div>
          ) : null}
        </>
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
              return reload();
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
