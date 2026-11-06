// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField } from '@docuvate/contracts';
import {
  AlertTriangle,
  ListChecks,
  Loader2,
  RotateCcw,
  Tags,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { presentExtractionFailure } from '../../lib/documentExtractionState';
import {
  documentStageState,
  fieldsNeedingReview,
  nextDocumentAction,
} from '../../lib/documentPipeline';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { DocumentStageTrack } from './DocumentStageTrack';

interface DocumentPipelineHeaderProps {
  doc: DocumentDto;
  /** Recognized fields as currently shown (includes unsaved confirmations). */
  fields: readonly ExtractedField[];
  requeueBusy: boolean;
  onRequeue: () => void;
  /** Open the details (fields) or labels panel of the viewer. */
  onOpenPanel: (panel: 'details' | 'labels') => void;
}

/**
 * Viewer header band: where this document is in Upload → Structure → Review → Export and the
 * single next best action (retry, review fields/labels, or export this document's values).
 */
export function DocumentPipelineHeader({
  doc,
  fields,
  requeueBusy,
  onRequeue,
  onOpenPanel,
}: DocumentPipelineHeaderProps) {
  const { t } = useTranslation();
  const state = documentStageState(doc);
  const action = nextDocumentAction(state);
  const lowConfidence = fieldsNeedingReview(fields);
  const labelSuggestions = doc.tagSuggestions?.length ?? 0;
  const inInbox = doc.tags.some((tag) => tag.isInbox);

  let body: ReactNode;
  switch (action) {
    case 'wait':
      body = (
        <>
          <p className="pipeline-next-title">
            <Loader2 size={16} strokeWidth={2} className="pipeline-spin" aria-hidden />
            {t('pipeline.viewer.wait.title')}
          </p>
          <p className="pipeline-next-text">{t('pipeline.viewer.wait.text')}</p>
        </>
      );
      break;
    case 'retry':
      body = (
        <>
          <p className="pipeline-next-title">
            <AlertTriangle size={16} strokeWidth={2} aria-hidden />
            {t('pipeline.viewer.retry.title')}
          </p>
          <p className="pipeline-next-text">
            {presentExtractionFailure(doc.extractionFailureReason).userMessage}
          </p>
          <div className="pipeline-next-actions">
            <Button type="button" variant="primary" disabled={requeueBusy} onClick={onRequeue}>
              <RotateCcw size={16} strokeWidth={2} aria-hidden />
              {t('pipeline.viewer.retry.action')}
            </Button>
          </div>
        </>
      );
      break;
    case 'review': {
      const hints = [
        lowConfidence > 0 ? t('pipeline.viewer.review.fields', { count: lowConfidence }) : null,
        labelSuggestions > 0
          ? t('pipeline.viewer.review.labels', { count: labelSuggestions })
          : null,
        inInbox && labelSuggestions === 0 ? t('pipeline.viewer.review.inbox') : null,
      ].filter((hint): hint is string => hint != null);
      body = (
        <>
          <p className="pipeline-next-title">
            <ListChecks size={16} strokeWidth={2} aria-hidden />
            {t('pipeline.viewer.review.title')}
          </p>
          {hints.length > 0 ? <p className="pipeline-next-text">{hints.join(' ')}</p> : null}
          <div className="pipeline-next-actions">
            <Button
              type="button"
              variant={lowConfidence > 0 || labelSuggestions === 0 ? 'primary' : 'secondary'}
              onClick={() => {
                onOpenPanel('details');
              }}
            >
              <ListChecks size={16} strokeWidth={2} aria-hidden />
              {t('pipeline.viewer.review.fieldsAction')}
            </Button>
            <Button
              type="button"
              variant={lowConfidence === 0 && labelSuggestions > 0 ? 'primary' : 'secondary'}
              onClick={() => {
                onOpenPanel('labels');
              }}
            >
              <Tags size={16} strokeWidth={2} aria-hidden />
              {t('pipeline.viewer.review.labelsAction')}
            </Button>
            <Link to={routes.reviewQueue} className="btn btn-ghost">
              {t('pipeline.viewer.review.queueAction')}
            </Link>
          </div>
        </>
      );
      break;
    }
    case 'none':
      // A record needs no prompt; export lives in the document header menu.
      return null;
  }

  return (
    <section
      className={`pipeline-doc-header pipeline-doc-header--${state}`}
      aria-label={t('pipeline.viewer.nextLabel')}
      data-stage-state={state}
    >
      <DocumentStageTrack state={state} className="pipeline-doc-header-track" />
      <div className="pipeline-next" aria-live="polite">
        {body}
      </div>
    </section>
  );
}
