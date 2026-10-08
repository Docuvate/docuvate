import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DocumentDto, ExtractedField, ExtractionBlock } from '@docuvate/contracts';
import { hasExtractedContent, isExtractionPending } from '../../lib/documentExtractionState';
import { useAdvancedFeaturesEnabled } from '../../lib/advancedFeatures';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DocumentExtractionRecovery } from './DocumentExtractionRecovery';
import { ExtractedTextPanel } from './ExtractedTextPanel';
import { ExtractionArenaPanel } from './ExtractionArenaPanel';

interface DocumentExtractionSectionProps {
  doc: DocumentDto;
  blocks: ExtractionBlock[];
  saving: boolean;
  blocksDirty: boolean;
  viewerPage: number;
  activeBlockIndex: number | null;
  onViewerPageChange: (page: number) => void;
  onActiveBlockIndexChange: (index: number | null) => void;
  onBlocksChange: (blocks: ExtractionBlock[]) => void;
  onSaveBlocks: () => void;
  onHighlightBlocks: (blocks: ExtractionBlock[]) => void;
  onExtractionRefresh?: () => void | Promise<void>;
  requeueBusy?: boolean;
  onRequeueExtraction?: () => void;
  /** Kept for API compatibility; fields live in Details tab only. */
  fields?: ExtractedField[];
  onFieldsChange?: (fields: ExtractedField[]) => void;
  onSaveFields?: () => void;
}

export function DocumentExtractionSection({
  doc,
  blocks,
  saving,
  blocksDirty,
  viewerPage,
  activeBlockIndex,
  onViewerPageChange,
  onActiveBlockIndexChange,
  onBlocksChange,
  onSaveBlocks,
  onHighlightBlocks,
  onExtractionRefresh,
  requeueBusy = false,
  onRequeueExtraction,
}: DocumentExtractionSectionProps) {
  const { t } = useTranslation();
  const { advancedFeaturesEnabled } = useAdvancedFeaturesEnabled();
  const fullText = doc.extraction?.text ?? '';
  const extractionMarkdown = doc.extraction?.markdown ?? null;
  const [editMode, setEditMode] = useState(false);
  const arenaDetailsRef = useRef<HTMLDetailsElement>(null);
  const hasContent = hasExtractedContent(doc, blocks);
  const pending = isExtractionPending(doc.status);
  const failed = doc.status === 'failed';
  const showRecovery = failed || pending;
  const showReadyNoText =
    !hasContent && !pending && !failed && doc.status === 'ready' && onRequeueExtraction;
  const [arenaOpenOverride, setArenaOpenOverride] = useState<boolean | null>(null);
  const arenaOpen =
    arenaOpenOverride ??
    (advancedFeaturesEnabled && (failed || !hasExtractedContent(doc, blocks)));

  function openArena() {
    const details = arenaDetailsRef.current;
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return (
    <Card className="extraction-panel extraction-panel-side">
      <div className="extraction-panel-head detail-pane-head">
        <h2 className="detail-pane-title">{t('documents.textPanelTitle')}</h2>
        <div className="extraction-panel-head-actions">
          {hasContent ? (
            <>
              <Button
                type="button"
                variant={editMode ? 'secondary' : 'ghost'}
                aria-pressed={editMode}
                onClick={() => setEditMode((on) => !on)}
              >
                {editMode ? t('documents.doneEditingExtractedText') : t('documents.editExtractedText')}
              </Button>
              {editMode && blocksDirty ? (
                <Button type="button" variant="secondary" disabled={saving} onClick={onSaveBlocks}>
                  {saving ? t('documents.saving') : t('documents.save')}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {showRecovery && onRequeueExtraction ? (
        <DocumentExtractionRecovery
          doc={doc}
          requeueBusy={requeueBusy}
          onRequeue={onRequeueExtraction}
          onOpenArena={advancedFeaturesEnabled ? openArena : undefined}
          compact
        />
      ) : null}

      {showReadyNoText ? (
        <div className="extraction-empty-ready" role="status">
          <p className="muted">{t('documents.extractionNoTextRecognized')}</p>
          <Button type="button" disabled={requeueBusy} onClick={onRequeueExtraction}>
            {requeueBusy ? t('documents.reprocessPending') : t('documents.extractionRetryText')}
          </Button>
        </div>
      ) : null}

      {hasContent ? (
        <ExtractedTextPanel
          fullText={fullText}
          markdown={extractionMarkdown}
          blocks={blocks}
          activePage={viewerPage}
          activeBlockIndex={activeBlockIndex}
          editMode={editMode}
          pageSynced
          allowCopy={hasContent}
          onActivePageChange={onViewerPageChange}
          onHighlightBlocks={onHighlightBlocks}
          onBlocksChange={onBlocksChange}
          onActiveBlockIndexChange={onActiveBlockIndexChange}
        />
      ) : null}

      {advancedFeaturesEnabled ? (
        <details
          className="extraction-arena-details"
          ref={arenaDetailsRef}
          open={arenaOpen}
          onToggle={(e) => setArenaOpenOverride(e.currentTarget.open)}
        >
          <summary className="extraction-arena-summary">{t('documents.arenaSummary')}</summary>
          <ExtractionArenaPanel
            documentId={doc.id}
            embedded
            onExtractionApplied={onExtractionRefresh}
          />
        </details>
      ) : null}
    </Card>
  );
}
