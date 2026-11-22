// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField, FieldSuggestionRow } from '@docuvate/contracts';
import { ArrowLeft, ArrowRight, CheckCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { summarizeDocumentOpenWork } from '../../lib/documentOpenWork';
import { documentStageState } from '../../lib/documentPipeline';
import {
  safeConfirmKeys,
  type SuggestionRejectRef,
  workbenchRows,
} from '../../lib/reviewWorkbench';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { routes } from '../../lib/routes';
import { type StructuringAspect, structuringAspects } from '../../lib/structuringAspects';
import { AppRibbon, RibbonGroup } from '../layout/AppRibbon';
import { StagePill } from '../pipeline';
import { Button } from '../ui/Button';
import { DocumentDetailOverflowMenu } from './DocumentDetailOverflowMenu';
import { DocumentRibbonTabs } from './DocumentRibbonTabs';

function reviewDocumentHref(documentId: string): string {
  return `${routes.documents}/${documentId}?review=1`;
}

interface DocumentStructuringRibbonProps {
  doc: DocumentDto;
  fields: readonly ExtractedField[];
  suggestions: readonly FieldSuggestionRow[];
  rejects: readonly SuggestionRejectRef[];
  reviewable: boolean;
  saving: boolean;
  nextDocumentId: string | null;
  activeAspect: StructuringAspect | null;
  onOpenAspect: (aspect: StructuringAspect) => void;
  onConfirmMany: (keys: string[]) => void;
  /** Show structuring tabs (layout workspace and/or reviewable). */
  showAspects: boolean;
  /** Document identity (back link, stage, title, overflow) in the primary ribbon row. */
  ribbonIdentity?: boolean;
  onDelete?: () => void;
  onRequeueExtraction?: () => void;
  requeueBusy?: boolean;
  showTechnicalDetails?: boolean;
  onShowTechnicalDetailsChange?: (open: boolean) => void;
}

/**
 * Document-owned primary ribbon: identity, Fluent tabs, review actions.
 * Context tools and Felder/Labels galleries portal into shell slots separately.
 */
export function DocumentStructuringRibbon({
  doc,
  fields,
  suggestions,
  rejects,
  reviewable,
  saving,
  nextDocumentId,
  activeAspect,
  onOpenAspect,
  onConfirmMany,
  showAspects,
  ribbonIdentity = false,
  onDelete,
  onRequeueExtraction,
  requeueBusy = false,
  showTechnicalDetails = false,
  onShowTechnicalDetailsChange,
}: DocumentStructuringRibbonProps) {
  const { t } = useTranslation();
  const title = doc.title.trim() || doc.filename;
  const aspects = useMemo(
    () => structuringAspects(doc, { fields, suggestions, rejects }),
    [doc, fields, suggestions, rejects]
  );
  const rows = useMemo(
    () => workbenchRows(fields, suggestions, rejects),
    [fields, suggestions, rejects]
  );
  const openWork = useMemo(
    () => summarizeDocumentOpenWork(doc, fields, suggestions, rejects),
    [doc, fields, suggestions, rejects]
  );
  const safeKeys = safeConfirmKeys(rows);

  if (!showAspects && !reviewable && !ribbonIdentity) {
    return null;
  }

  return (
    <AppRibbon>
      {ribbonIdentity ? (
        <RibbonGroup label={t('ribbon.identity')} kind="navigate" order={0} showCaption={false}>
          <div className="structuring-ribbon-identity">
            <Link
              to={routes.documents}
              className={ribbonActionClass('tertiary', {
                className: 'structuring-ribbon-back document-detail-back-link',
              })}
              aria-label={t('ribbon.identityBackAria')}
            >
              <ArrowLeft size={16} strokeWidth={2} aria-hidden />
              <span className="structuring-ribbon-back-label">{t('documents.breadcrumbDocuments')}</span>
            </Link>
            <StagePill state={documentStageState(doc)} status={doc.status} />
            <h1
              className="structuring-ribbon-title"
              data-ux="page-title"
              title={`${title}${doc.filename !== title ? ` · ${doc.filename}` : ''}`}
            >
              {title}
            </h1>
            {onDelete ? (
              <DocumentDetailOverflowMenu
                variant="ribbon"
                doc={doc}
                onDelete={onDelete}
                onRequeueExtraction={onRequeueExtraction}
                requeueBusy={requeueBusy}
                showTechnicalDetails={showTechnicalDetails}
                onShowTechnicalDetailsChange={onShowTechnicalDetailsChange}
              />
            ) : null}
          </div>
        </RibbonGroup>
      ) : null}
      {showAspects ? (
        <RibbonGroup label={t('ribbon.structure')} kind="navigate" order={1} showCaption={false}>
          <DocumentRibbonTabs
            statuses={aspects}
            active={activeAspect}
            onOpen={(aspect) => {
              onOpenAspect(aspect);
              if (aspect !== 'fields') return;
              window.requestAnimationFrame(() => {
                document
                  .querySelector('.review-workbench')
                  ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              });
            }}
          />
        </RibbonGroup>
      ) : null}
      {reviewable ? (
        <RibbonGroup label={t('ribbon.review')} kind="act" order={2}>
          <div className="review-workbench-actions">
            <Button
              type="button"
              size="sm"
              variant={safeKeys.length > 0 ? 'primary' : 'secondary'}
              className={`ribbon-action ribbon-action--${safeKeys.length > 0 ? 'primary' : 'secondary'}`}
              disabled={saving || safeKeys.length === 0}
              onClick={() => {
                onConfirmMany(safeKeys);
              }}
            >
              <CheckCheck size={16} strokeWidth={2} aria-hidden />
              {t('pipeline.workbench.acceptSafe', { count: safeKeys.length })}
            </Button>
            {nextDocumentId ? (
              <Link
                to={reviewDocumentHref(nextDocumentId)}
                className={ribbonActionClass(openWork.isDone ? 'primary' : 'secondary', {
                  className: 'review-workbench-next',
                })}
                aria-keyshortcuts="N"
              >
                {t('pipeline.workbench.next')}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            ) : (
              <Link to={routes.reviewQueue} className={ribbonActionClass('tertiary')}>
                {t('pipeline.viewer.review.queueAction')}
              </Link>
            )}
          </div>
        </RibbonGroup>
      ) : null}
    </AppRibbon>
  );
}
