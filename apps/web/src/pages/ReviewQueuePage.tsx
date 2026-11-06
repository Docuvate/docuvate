// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, FileText } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import {
  acceptDocumentReviewHighConfidenceBatch,
  archiveHashIdenticalDuplicateSets,
  getDocumentReviewQueueSummary,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { flattenCursorPages } from '../lib/pagination/useCursorInfiniteQuery';
import { useDocumentReviewQueueInfiniteQuery } from '../lib/review/useDocumentReviewQueueInfiniteQuery';
import { routes } from '../lib/routes';

function reviewHref(documentId: string): string {
  return `${routes.documents}/${documentId}?review=1`;
}

/**
 * Next-work queue for structuring. Opens the document workbench directly instead of a
 * second wizard that competed with the viewer inspector.
 */
export function ReviewQueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pushSuccess, pushError } = useToastNotify();
  const [batchBusy, setBatchBusy] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

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
  const summary = useQuery({
    queryKey: ['document-review-queue-summary'],
    queryFn: getDocumentReviewQueueSummary,
  });
  const refetchSummary = summary.refetch;
  const pendingCount = summary.data?.pendingCount;
  const nextItem = items[0] ?? null;

  const reload = useCallback(async () => {
    await Promise.all([refetch(), refetchSummary()]);
  }, [refetch, refetchSummary]);

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

  return (
    <div className="page review-queue-page" data-ux="page" data-testid="review-next-work">
      <PageHeader
        className="review-queue-header"
        title={t('reviewQueue.title')}
        description={t('reviewQueue.nextWorkLead')}
      />

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

      {!loading && !loadError && items.length > 0 ? (
        <>
          <section className="review-next-hero" aria-labelledby="review-next-title">
            <p className="muted review-next-count">
              {pendingCount != null
                ? t('reviewQueue.bulkTitleCount', { count: pendingCount })
                : t('reviewQueue.bulkTitle')}
            </p>
            <h2 id="review-next-title" className="review-next-title">
              {t('reviewQueue.nextDocument')}
            </h2>
            {nextItem ? (
              <Card className="review-next-card">
                <div className="review-next-card-main">
                  <FileText size={22} aria-hidden />
                  <div>
                    <p className="review-next-filename">{nextItem.filename}</p>
                    <p className="muted">
                      {t('reviewQueue.openFieldsHint', {
                        fields: nextItem.fieldSuggestions.length ?? 0,
                        labels: nextItem.labelSuggestions.length ?? 0,
                      })}
                    </p>
                  </div>
                </div>
                <Link
                  className="btn btn-primary review-open-structuring"
                  data-testid="review-open-structuring"
                  to={reviewHref(nextItem.documentId)}
                >
                  {t('reviewQueue.openStructuring')}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </Card>
            ) : null}
            <div className="review-queue-bulk-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={batchBusy}
                onClick={() => { setBatchConfirmOpen(true); }}
              >
                {t('reviewQueue.batchHighConfidence')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={batchBusy}
                onClick={() => { setArchiveConfirmOpen(true); }}
              >
                {t('reviewQueue.archiveHashIdenticalDuplicates')}
              </Button>
            </div>
          </section>

          <section className="review-next-list" aria-label={t('reviewQueue.queueListAria')}>
            <ol className="review-next-items">
              {items.map((item, index) => (
                <li key={item.documentId} className="review-next-item">
                  <Link className="review-next-item-link" to={reviewHref(item.documentId)}>
                    <span className="review-next-item-index">{index + 1}</span>
                    <span className="review-next-item-name">{item.filename}</span>
                    <span className="muted">{t('reviewQueue.structureAction')}</span>
                  </Link>
                </li>
              ))}
            </ol>
            {hasNextPage ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isFetchingNextPage}
                onClick={() => { void fetchNextPage(); }}
              >
                {t('common.loadMore')}
              </Button>
            ) : null}
          </section>
        </>
      ) : null}

      <ConfirmDialog
        open={batchConfirmOpen}
        title={t('reviewQueue.batchConfirmTitle')}
        description={t('reviewQueue.batchConfirmBody')}
        confirmLabel={t('reviewQueue.batchHighConfidence')}
        onCancel={() => { setBatchConfirmOpen(false); }}
        onConfirm={() => {
          setBatchConfirmOpen(false);
          void onBatchHighConfidence();
        }}
      />

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
