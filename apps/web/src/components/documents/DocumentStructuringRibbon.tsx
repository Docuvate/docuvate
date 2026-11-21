// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField, FieldSuggestionRow } from '@docuvate/contracts';
import { ArrowRight, CheckCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { summarizeDocumentOpenWork } from '../../lib/documentOpenWork';
import {
  safeConfirmKeys,
  type SuggestionRejectRef,
  workbenchRows,
} from '../../lib/reviewWorkbench';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { routes } from '../../lib/routes';
import { type StructuringAspect, structuringAspects } from '../../lib/structuringAspects';
import { StructuringAspectStrip } from '../pipeline/StructuringAspectStrip';
import { AppRibbon, RibbonGroup } from '../layout/AppRibbon';
import { Button } from '../ui/Button';
import { DocumentDetailPanelMenu, type InspectorPanel } from './DocumentDetailMetaBar';

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
  inspectorPanels: readonly InspectorPanel[];
  inspector: InspectorPanel | null;
  onInspectorChange: (tab: InspectorPanel | null) => void;
  onAddField: () => void;
  /** Show aspect strip (layout workspace and/or reviewable). */
  showAspects: boolean;
}

/**
 * Document-owned primary ribbon: aspects left, review + panel right.
 * Context row (text/layout/table tools) is portaled separately into the shell slot.
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
  inspectorPanels,
  inspector,
  onInspectorChange,
  onAddField,
  showAspects,
}: DocumentStructuringRibbonProps) {
  const { t } = useTranslation();
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

  if (!showAspects && !reviewable) {
    return (
      <AppRibbon>
        <RibbonGroup label={t('ribbon.structureActions')} kind="act" align="end" order={3}>
          <DocumentDetailPanelMenu
            panels={inspectorPanels}
            activeTab={inspector}
            labelCount={doc.tags.length}
            onTabChange={onInspectorChange}
            onAddField={onAddField}
          />
        </RibbonGroup>
      </AppRibbon>
    );
  }

  return (
    <AppRibbon>
      {showAspects ? (
        <RibbonGroup label={t('ribbon.structure')} kind="navigate" order={1} showCaption={false}>
          <StructuringAspectStrip
            statuses={aspects}
            className="review-workbench-aspects"
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
      <RibbonGroup label={t('ribbon.structureActions')} kind="act" align="end" order={3}>
        <DocumentDetailPanelMenu
          panels={inspectorPanels}
          activeTab={inspector}
          labelCount={doc.tags.length}
          onTabChange={onInspectorChange}
          onAddField={onAddField}
        />
      </RibbonGroup>
    </AppRibbon>
  );
}
