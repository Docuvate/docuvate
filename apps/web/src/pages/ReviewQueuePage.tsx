// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentReviewQueueItemDto } from '@docuvate/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { documentDisplayDateParts } from '../components/library/libraryDocumentUtils';
import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import {
  acceptDocumentReviewAll,
  acceptDocumentReviewHighConfidenceBatch,
  dismissDocumentTagSuggestion,
  listDocumentReviewQueue,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { routes } from '../lib/routes';

export function ReviewQueuePage() {
  const { t, i18n } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [items, setItems] = useState<DocumentReviewQueueItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  const locale = i18n.language.startsWith('de') ? 'de-DE' : 'en-US';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDocumentReviewQueue();
      setItems(res.items);
      setFocusIndex(0);
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

  useEffect(() => {
    cardRefs.current[focusIndex]?.focus();
  }, [focusIndex, items.length]);

  async function onAcceptAll(item: DocumentReviewQueueItemDto) {
    setBusyId(item.documentId);
    try {
      await acceptDocumentReviewAll(item.documentId);
      pushSuccess(t('common.saved'));
      await load();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBusyId(null);
    }
  }

  async function onDismissLabel(item: DocumentReviewQueueItemDto, tagId: string) {
    setBusyId(`${item.documentId}:${tagId}`);
    try {
      await dismissDocumentTagSuggestion(item.documentId, tagId);
      await load();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBusyId(null);
    }
  }

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

  function onCardKeyDown(event: React.KeyboardEvent, item: DocumentReviewQueueItemDto) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void onAcceptAll(item);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, items.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, items.length - 1));
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  const showKeyboardHint = !loading && items.length > 0;

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
            disabled={batchBusy || loading || items.length === 0}
            onClick={() => void onBatchHighConfidence()}
          >
            {t('reviewQueue.batchHighConfidence')}
          </Button>
        </div>
      </header>

      {loading ? <p className="muted">{t('reviewQueue.loading')}</p> : null}
      {!loading && items.length === 0 ? (
        <p className="muted">{t('reviewQueue.empty')}</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="review-queue-list" role="listbox" aria-label={t('reviewQueue.title')}>
          {items.map((item, index) => {
            const dateParts = documentDisplayDateParts(
              {
                documentDate: item.documentDate ?? undefined,
                createdAt: item.uploadDate,
                updatedAt: item.uploadDate,
              },
              locale
            );
            const suggestedDate = item.suggestedDocumentDate
              ? new Date(`${item.suggestedDocumentDate}T12:00:00`).toLocaleDateString(locale, {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : null;
            const cardBusy =
              busyId === item.documentId || Boolean(busyId?.startsWith(`${item.documentId}:`));
            const actionsDisabled = cardBusy ? true : batchBusy;
            const displayTitle = item.title.trim().length > 0 ? item.title : item.filename;
            return (
              <li
                key={item.documentId}
                role="option"
                aria-selected={index === focusIndex}
                className={`review-queue-card-wrap${index === focusIndex ? ' review-queue-card-focused' : ''}`}
                tabIndex={index === focusIndex ? 0 : -1}
                ref={(el: HTMLLIElement | null) => {
                  cardRefs.current[index] = el;
                }}
                onFocus={() => { setFocusIndex(index); }}
                onKeyDown={(e) => { onCardKeyDown(e, item); }}
              >
                <Card className="review-queue-card">
                  <div className="review-queue-card-head">
                    <Link to={routes.document(item.documentId)} className="review-queue-doc-link">
                      {displayTitle}
                    </Link>
                    <span className="muted review-queue-date">
                      {t('reviewQueue.documentDate')}: {dateParts.text}
                      {dateParts.isUploadFallback ? ` (${t('library.dateUploadFallback')})` : ''}
                      {suggestedDate ? ` · ${t('reviewQueue.suggestedDate', { date: suggestedDate })}` : ''}
                    </span>
                  </div>

                  {item.labelSuggestions.length > 0 ? (
                    <section className="review-queue-section">
                      <h2 className="review-queue-section-title">{t('reviewQueue.labelsSection')}</h2>
                      <div className="chip-row">
                        {item.labelSuggestions.map((s) => (
                          <Chip
                            key={s.tag.id}
                            label={s.tag.name}
                            variant="suggest"
                            color={s.tag.color}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {item.fieldSuggestions.length > 0 ? (
                    <section className="review-queue-section">
                      <h2 className="review-queue-section-title">{t('reviewQueue.fieldsSection')}</h2>
                      <dl className="review-queue-fields">
                        {item.fieldSuggestions.map((field) => (
                          <div key={field.key} className="review-queue-field-row">
                            <dt>{field.displayLabel}</dt>
                            <dd>{field.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ) : null}

                  {item.duplicateStack?.pendingReview ? (
                    <section className="review-queue-section">
                      <h2 className="review-queue-section-title">{t('reviewQueue.duplicatesSection')}</h2>
                      <p className="muted">{t('reviewQueue.duplicatesPending')}</p>
                      <Link to={routes.document(item.documentId)} className="review-queue-inline-link">
                        {t('reviewQueue.openDuplicateReview')}
                      </Link>
                    </section>
                  ) : null}

                  <div className="review-queue-card-actions">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={actionsDisabled}
                      onClick={() => void onAcceptAll(item)}
                    >
                      {t('reviewQueue.acceptAll')}
                    </Button>
                    {item.labelSuggestions.map((s) => (
                      <Button
                        key={`dismiss-${s.tag.id}`}
                        type="button"
                        variant="ghost"
                        disabled={actionsDisabled}
                        onClick={() => void onDismissLabel(item, s.tag.id)}
                      >
                        {t('reviewQueue.rejectLabel', { name: s.tag.name })}
                      </Button>
                    ))}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showKeyboardHint ? (
        <p className="muted review-queue-keyboard-hint">{t('reviewQueue.keyboardHint')}</p>
      ) : null}
    </div>
  );
}
