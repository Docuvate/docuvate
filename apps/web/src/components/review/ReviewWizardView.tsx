// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, DocumentReviewQueueItemDto } from '@docuvate/contracts';
import {
  documentUsesPdfPreview,
  parseSuggestionStorageKey,
  semanticFieldKey,
} from '@docuvate/contracts';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  acceptDocumentTagSuggestion,
  dismissDocumentTagSuggestion,
  fetchDocumentPreviewBlob,
  getDocument,
  updateDocument,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { isoDateFromExtractedValue } from '../../lib/documentAutoDocumentDate';
import { fetchDocumentPreviewBuffer } from '../../lib/documentPreviewCache';
import { findBlockAtPoint } from '../../lib/extractionLayout';
import { previewFieldNormalization } from '../../lib/review/reviewFieldCorrection';
import {
  buildReviewWizardPlan,
  reviewWizardProgress,
  type ReviewWizardStepKind,
  type ReviewWizardSuggestionTask,
} from '../../lib/review/reviewWizardPlan';
import { routes } from '../../lib/routes';
import { DocumentPreviewCard } from '../documents/DocumentPreviewCard';
import { useToastNotify } from '../save/ToastProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Progress } from '../ui/Progress';

interface ReviewWizardViewProps {
  items: DocumentReviewQueueItemDto[];
  batchBusy: boolean;
  onReload: () => Promise<void>;
}

const STEP_LABEL_KEYS: Record<ReviewWizardStepKind, string> = {
  labels: 'reviewWizard.stepLabels',
  fields: 'reviewWizard.stepFields',
  date: 'reviewWizard.stepDate',
  duplicates: 'reviewWizard.stepDuplicates',
  done: 'reviewWizard.stepDone',
};

export function ReviewWizardView({
  items,
  batchBusy,
  onReload,
}: ReviewWizardViewProps) {
  const { t, i18n } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const plan = useMemo(() => buildReviewWizardPlan(items), [items]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correctionDraft, setCorrectionDraft] = useState('');
  const [docCache, setDocCache] = useState<DocumentDto | null>(null);
  const [previewData, setPreviewData] = useState<ArrayBuffer | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [viewerPage, setViewerPage] = useState(1);
  const [selectionHint, setSelectionHint] = useState<string | null>(null);

  const task = plan.tasks[taskIndex];
  const progress = reviewWizardProgress(plan, taskIndex);
  const locale = i18n.language.startsWith('de') ? 'de-DE' : 'en-US';

  const loadDocumentContext = useCallback(async (documentId: string) => {
    setPreviewLoading(true);
    try {
      const doc = await getDocument(documentId);
      setDocCache(doc);
      const blocks = doc.extraction?.blocks ?? [];
      if (blocks.length > 0) {
        setViewerPage(blocks[0]?.page ?? 1);
      }
      if (documentUsesPdfPreview(doc.mimeType, Boolean(doc.previewAvailable))) {
        const buffer = await fetchDocumentPreviewBuffer(documentId, () => fetchDocumentPreviewBlob(documentId));
        setPreviewData(buffer);
      } else {
        setPreviewData(null);
      }
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.loadFailed'));
      setDocCache(null);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [pushError]);

  useEffect(() => {
    if (plan.tasks.length === 0) return;
    const current = plan.tasks[taskIndex] ?? plan.tasks[0];
    setCorrecting(false);
    setCorrectionDraft('');
    setSelectionHint(null);
    if (current.stepKind !== 'fields') {
      setDocCache(null);
      setPreviewData(null);
      setPreviewLoading(false);
      return;
    }
    void loadDocumentContext(current.documentId);
  }, [plan.tasks, taskIndex, loadDocumentContext]);

  useEffect(() => {
    if (taskIndex >= plan.tasks.length && plan.tasks.length > 0) {
      setTaskIndex(plan.tasks.length - 1);
    }
  }, [plan.tasks.length, taskIndex]);

  function advanceTask() {
    setTaskIndex((prev) => Math.min(prev + 1, Math.max(plan.tasks.length - 1, 0)));
    if (taskIndex >= plan.tasks.length - 1) {
      void onReload();
    }
  }

  async function acceptLabelSuggestion(current: ReviewWizardSuggestionTask) {
    const tagId = current.labelSuggestion?.tag.id;
    if (!tagId) return;
    setBusy(true);
    try {
      await acceptDocumentTagSuggestion(current.documentId, tagId);
      pushSuccess(t('common.saved'));
      advanceTask();
      await onReload();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function rejectLabelSuggestion(current: ReviewWizardSuggestionTask) {
    const tagId = current.labelSuggestion?.tag.id;
    if (!tagId) return;
    setBusy(true);
    try {
      await dismissDocumentTagSuggestion(current.documentId, tagId);
      pushSuccess(t('common.saved'));
      advanceTask();
      await onReload();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function acceptFieldSuggestion(current: ReviewWizardSuggestionTask, valueOverride?: string) {
    const field = current.fieldSuggestion;
    if (!field || !docCache) return;
    const value = (valueOverride ?? field.value).trim();
    setBusy(true);
    try {
      const prevFields = docCache.extraction?.fields ?? [];
      const key = field.key;
      const suggestionSemantic = parseSuggestionStorageKey(key);
      const kept = prevFields.filter((f) => {
        const sem = parseSuggestionStorageKey(f.key);
        return sem !== key && f.key !== key && sem !== suggestionSemantic;
      });
      const nextFields = [...kept, { key, value, confidence: 0.95 }];
      const patch: { extractionFields: typeof nextFields; documentDate?: string | null } = {
        extractionFields: nextFields,
      };
      const sem = semanticFieldKey({ key, value });
      if (sem === 'date' || key === 'date') {
        const iso = isoDateFromExtractedValue(value);
        if (iso) patch.documentDate = iso;
      }
      await updateDocument(current.documentId, patch);
      pushSuccess(t('common.saved'));
      setCorrecting(false);
      advanceTask();
      await onReload();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  async function acceptSuggestedDate(current: ReviewWizardSuggestionTask) {
    const raw = current.suggestedDocumentDate;
    if (!raw) return;
    setBusy(true);
    try {
      await updateDocument(current.documentId, { documentDate: raw });
      pushSuccess(t('common.saved'));
      advanceTask();
      await onReload();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    } finally {
      setBusy(false);
    }
  }

  function onPdfPageClick(page: number, nx: number, ny: number) {
    if (!correcting || !docCache) return;
    const blocks = docCache.extraction?.blocks ?? [];
    const hit = findBlockAtPoint(blocks, page, nx, ny);
    if (!hit?.text) return;
    setCorrectionDraft((prev) => (prev.trim().length > 0 ? `${prev} ${hit.text}` : hit.text));
    setSelectionHint(hit.text);
  }

  const normalization = task.fieldSuggestion
    ? previewFieldNormalization(task.fieldSuggestion.key, correcting ? correctionDraft : task.fieldSuggestion.value)
    : null;

  const stepStatuses = useMemo(() => {
    const docSteps = plan.documents.find((d) => d.documentId === task.documentId)?.steps ?? [];
    return docSteps.map((kind, index) => {
      const completed = index < task.stepIndex;
      const current = index === task.stepIndex;
      return { kind, completed, current };
    });
  }, [plan.documents, task.documentId, task.stepIndex]);

  if (plan.tasks.length === 0) {
    return null;
  }

  const confidencePct =
    task.fieldSuggestion?.confidence != null
      ? Math.round(task.fieldSuggestion.confidence * 100)
      : task.labelSuggestion?.confidence != null
        ? Math.round(task.labelSuggestion.confidence * 100)
        : null;

  const actionsDisabled = busy || batchBusy;

  return (
    <div className="review-wizard">
      <div className="review-wizard-progress">
        <Progress
          value={progress.taskCount > 0 ? ((progress.taskIndex + 1) / progress.taskCount) * 100 : 0}
          label={t('reviewWizard.documentProgress', {
            current: progress.documentIndex + 1,
            total: Math.max(progress.documentCount, 1),
          })}
        />
      </div>
      <div className="review-wizard-layout">
        <Card className="review-wizard-steps" aria-label={t('reviewWizard.stepsAria')}>
          <ol className="review-wizard-step-list">
            {stepStatuses.map((step, idx) => (
              <li
                key={`${task.documentId}-${step.kind}`}
                className={`review-wizard-step${step.completed ? ' review-wizard-step-done' : ''}${step.current ? ' review-wizard-step-current' : ''}`}
              >
                <span className="review-wizard-step-badge" aria-hidden="true">
                  {step.completed ? <Check size={14} strokeWidth={2.5} /> : idx + 1}
                </span>
                <span className="review-wizard-step-name">{t(STEP_LABEL_KEYS[step.kind])}</span>
              </li>
            ))}
          </ol>
          <p className="muted review-wizard-steps-foot">{t('reviewWizard.instantSaveHint')}</p>
        </Card>

        <Card className="review-wizard-card">
          <header className="review-wizard-card-head">
            <div className="review-wizard-thumb" aria-hidden="true">
              PDF
            </div>
            <div>
              <h2 className="review-wizard-doc-title">{task.documentTitle}</h2>
              <p className="muted review-wizard-suggestion-meta">
                {t('reviewWizard.suggestionProgress', {
                  current: task.suggestionIndex + 1,
                  total: task.suggestionCount,
                })}
              </p>
            </div>
          </header>

          {task.stepKind === 'labels' && task.labelSuggestion ? (
            <div className="review-wizard-field-block">
              <p className="review-wizard-kicker">{t('reviewWizard.labelKicker')}</p>
              <p className="review-wizard-value-lg">{task.labelSuggestion.tag.name}</p>
              {confidencePct != null ? (
                <p className="muted">{t('reviewQueue.confidenceHint', { percent: confidencePct })}</p>
              ) : null}
            </div>
          ) : null}

          {task.stepKind === 'fields' && task.fieldSuggestion ? (
            <div className="review-wizard-field-block">
              <p className="review-wizard-kicker">{t('reviewWizard.fieldKicker')}</p>
              <p className="review-wizard-field-name">{task.fieldSuggestion.displayLabel}</p>
              {correcting ? (
                <>
                  <label className="review-wizard-correction-label">
                    {t('reviewWizard.correctionHint')}
                    <Input
                      value={correctionDraft}
                      onChange={(e) => { setCorrectionDraft(e.target.value); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && normalization?.ok) {
                          e.preventDefault();
                          void acceptFieldSuggestion(task, correctionDraft);
                        }
                      }}
                    />
                  </label>
                  {normalization?.normalized && normalization.typeLabel ? (
                    <p className="review-wizard-normalized-preview">
                      → {normalization.normalized} ({normalization.typeLabel})
                    </p>
                  ) : null}
                  {normalization?.hintKey ? (
                    <p className="error review-wizard-field-hint">{t(normalization.hintKey)}</p>
                  ) : (
                    <p className="review-wizard-field-hint muted" aria-hidden="true">
                      {' '}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="review-wizard-value-xl">{task.fieldSuggestion.value}</p>
                  {confidencePct != null ? (
                    <p className="muted">{t('reviewQueue.confidenceHint', { percent: confidencePct })}</p>
                  ) : null}
                </>
              )}
              {docCache ? (
                <div className="review-wizard-preview-snippet">
                  <DocumentPreviewCard
                    doc={docCache}
                    previewData={previewData}
                    previewLoading={previewLoading}
                    isPdf={documentUsesPdfPreview(docCache.mimeType, Boolean(docCache.previewAvailable))}
                    isImage={false}
                    highlightBlocks={
                      selectionHint && docCache.extraction?.blocks
                        ? docCache.extraction.blocks.filter((b) => b.text.includes(selectionHint)).slice(0, 3)
                        : []
                    }
                    viewerPage={viewerPage}
                    onViewerPageChange={setViewerPage}
                    paginated
                    fitWidth
                    compact
                    title={t('reviewWizard.previewTitle')}
                    onPageClick={correcting ? onPdfPageClick : undefined}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {task.stepKind === 'date' ? (
            <div className="review-wizard-field-block">
              <p className="review-wizard-kicker">{t('reviewWizard.dateKicker')}</p>
              <p className="review-wizard-value-xl">
                {task.suggestedDocumentDate
                  ? new Date(`${task.suggestedDocumentDate}T12:00:00`).toLocaleDateString(locale)
                  : '—'}
              </p>
            </div>
          ) : null}

          {task.stepKind === 'duplicates' ? (
            <div className="review-wizard-field-block">
              <p className="muted">{t('reviewQueue.duplicatesPending')}</p>
              <Link to={routes.document(task.documentId)} className="review-queue-inline-link">
                {t('reviewQueue.openDuplicateReview')}
              </Link>
            </div>
          ) : null}

          <div className="review-wizard-actions">
            <Button type="button" variant="ghost" disabled={actionsDisabled} onClick={advanceTask}>
              {t('reviewWizard.skip')}
            </Button>
            <div className="review-wizard-actions-primary">
              {task.stepKind === 'labels' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={actionsDisabled}
                    onClick={() => void rejectLabelSuggestion(task)}
                  >
                    {t('reviewWizard.reject')}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={actionsDisabled}
                    onClick={() => void acceptLabelSuggestion(task)}
                  >
                    {t('reviewWizard.accept')}
                  </Button>
                </>
              ) : null}
              {task.stepKind === 'fields' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={actionsDisabled}
                    onClick={() => {
                      if (correcting) {
                        setCorrecting(false);
                        setCorrectionDraft('');
                      } else {
                        setCorrecting(true);
                        setCorrectionDraft(task.fieldSuggestion?.value ?? '');
                      }
                    }}
                  >
                    {t('reviewWizard.correct')}
                  </Button>
                  {correcting ? (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={actionsDisabled || !normalization?.ok}
                      onClick={() => void acceptFieldSuggestion(task, correctionDraft)}
                    >
                      {t('reviewWizard.saveCorrection')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={actionsDisabled}
                      onClick={() => void acceptFieldSuggestion(task)}
                    >
                      {t('reviewWizard.accept')}
                    </Button>
                  )}
                </>
              ) : null}
              {task.stepKind === 'date' ? (
                <Button
                  type="button"
                  variant="primary"
                  disabled={actionsDisabled}
                  onClick={() => void acceptSuggestedDate(task)}
                >
                  {t('reviewWizard.accept')}
                </Button>
              ) : null}
              {task.stepKind === 'duplicates' ? (
                <Button type="button" variant="secondary" disabled={actionsDisabled} onClick={advanceTask}>
                  {t('reviewWizard.continue')}
                </Button>
              ) : null}
            </div>
          </div>
          <p className="muted review-wizard-keyboard-hint">{t('reviewWizard.keyboardHint')}</p>
        </Card>
      </div>
    </div>
  );
}
