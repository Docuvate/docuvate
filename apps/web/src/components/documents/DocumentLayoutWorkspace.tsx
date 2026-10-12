// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField, ExtractionBlock } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isExtractionPending } from '../../lib/documentExtractionState';
import { findBlockIndexAtPoint } from '../../lib/extractionLayout';
import { layoutIrDocumentFromPageSummaries } from '../../lib/layoutIrPages';
import {
  buildLayoutOverlays,
  hitTestLayoutOverlay,
  overlayForExtractionBlock,
} from '../../lib/layoutOverlayModel';
import {
  firstPageBelowSsimFloor,
  reconstructionQualityTone,
} from '../../lib/layoutReconstructionQuality';
import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { useDocumentLayoutIr } from '../../lib/useDocumentLayoutIr';
import { useLayoutCompare } from '../../lib/useLayoutCompare';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DocumentExtractionRecovery } from './DocumentExtractionRecovery';
import { DocumentLayoutCompareView } from './DocumentLayoutCompareView';
import { DocumentLayoutExportTab } from './DocumentLayoutExportTab';
import { DocumentLayoutSidePanel, type LayoutSideTab, overlayRegionById } from './DocumentLayoutSidePanel';
import { ExtractedLayoutHtmlFrame, LAYOUT_IR_ZOOM_STEPS, type LayoutIrZoomStep } from './ExtractedLayoutHtmlFrame';
import { ExtractedTextPanel } from './ExtractedTextPanel';
import { type PdfLayoutOverlay, PdfViewer } from './PdfViewer';

type LeftDocumentMode = 'original' | 'text';
type AdvancedViewerMode = 'reconstruction' | 'compare';

interface DocumentLayoutWorkspaceProps {
  doc: DocumentDto;
  previewData: ArrayBuffer | null;
  previewLoading: boolean;
  previewUnavailable: boolean;
  blocks: ExtractionBlock[];
  fields: ExtractedField[];
  heuristicSuggestions?: { key: string; value: string }[];
  highlightBlocks: ExtractionBlock[];
  viewerPage: number;
  activeBlockIndex: number | null;
  knownFieldKeys: Set<string>;
  fieldLabelForKey: (key: string) => string;
  onViewerPageChange: (page: number) => void;
  onActiveBlockIndexChange: (index: number | null) => void;
  onHighlightBlocks: (blocks: ExtractionBlock[]) => void;
  onBlocksChange: (blocks: ExtractionBlock[]) => void;
  onAcceptFieldSuggestion: (key: string, value: string) => void;
  editMode: boolean;
  onEditModeChange: (edit: boolean) => void;
  blocksDirty: boolean;
  saving: boolean;
  onSaveBlocks: () => void;
  requeueBusy?: boolean;
  onRequeueExtraction?: () => void;
  textEditOpen: boolean;
  onTextEditOpenChange: (open: boolean) => void;
  documentChatAvailable?: boolean;
  documentChatUiEnabled?: boolean;
  showTechnicalDetails?: boolean;
}

export function DocumentLayoutWorkspace({
  doc,
  previewData,
  previewLoading,
  previewUnavailable,
  blocks,
  fields,
  heuristicSuggestions = [],
  highlightBlocks,
  viewerPage,
  activeBlockIndex,
  knownFieldKeys,
  fieldLabelForKey,
  onViewerPageChange,
  onActiveBlockIndexChange,
  onHighlightBlocks,
  onBlocksChange,
  onAcceptFieldSuggestion,
  editMode,
  onEditModeChange,
  blocksDirty,
  saving,
  onSaveBlocks,
  requeueBusy = false,
  onRequeueExtraction,
  textEditOpen,
  onTextEditOpenChange,
  documentChatAvailable = false,
  documentChatUiEnabled = true,
  showTechnicalDetails = false,
}: DocumentLayoutWorkspaceProps) {
  const { t } = useTranslation();
  const layoutIrAvailable = doc.extraction?.layoutIrAvailable === true;
  const layoutIrPages = doc.extraction?.layoutIrPages;
  const { layoutIr, state: layoutIrState } = useDocumentLayoutIr(
    doc.id,
    layoutIrAvailable,
    layoutIrPages
  );

  const [leftMode, setLeftMode] = useState<LeftDocumentMode>('original');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedView, setAdvancedView] = useState<AdvancedViewerMode>('reconstruction');
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [sideTab, setSideTab] = useState<LayoutSideTab>('fields');
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [hoverOverlay, setHoverOverlay] = useState<PdfLayoutOverlay | null>(null);
  const [layoutZoom, setLayoutZoom] = useState<LayoutIrZoomStep>(100);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => new Set());

  const layoutPageCount = layoutIr?.pages.length ?? layoutIrPages?.length ?? 1;
  const { metricsByPage, metrics: compareMetrics } = useLayoutCompare(
    doc.id,
    layoutIrAvailable && Boolean(doc.id),
    layoutPageCount,
    viewerPage,
    false
  );
  const ssimFloor = compareMetrics?.ssimFloor ?? 0.96;
  const qualityTone = reconstructionQualityTone(metricsByPage, ssimFloor);
  const qualityReviewPage = firstPageBelowSsimFloor(metricsByPage, ssimFloor);

  useEffect(() => {
    const nextTextOpen = leftMode === 'text';
    if (textEditOpen !== nextTextOpen) {
      onTextEditOpenChange(nextTextOpen);
    }
  }, [leftMode, onTextEditOpenChange, textEditOpen]);

  const setLeftDocumentMode = useCallback(
    (mode: LeftDocumentMode) => {
      setLeftMode(mode);
      if (mode === 'text') {
        setAdvancedOpen(false);
      }
    },
    []
  );

  const frameLayoutIr =
    layoutIr ??
    (layoutIrPages?.length ? layoutIrDocumentFromPageSummaries(layoutIrPages) : null);

  const overlays = useMemo(
    () => (layoutIr ? buildLayoutOverlays(layoutIr) : []),
    [layoutIr]
  );

  const pdfOverlays: PdfLayoutOverlay[] = useMemo(
    () =>
      overlays.map((o) => {
        let label = o.label;
        if (o.kind === 'table' && o.tableIndex != null) {
          label = t('documents.layoutTableLabel', { n: o.tableIndex + 1 });
        } else if (o.kind === 'field' && o.label) {
          label = fieldLabelForKey(o.label);
        }
        return {
          id: o.id,
          page: o.page,
          x: o.x,
          y: o.y,
          width: o.width,
          height: o.height,
          kind: o.kind,
          label,
          value: o.value,
        };
      }),
    [fieldLabelForKey, overlays, t]
  );

  const onOverlaySelect = useCallback(
    (overlayId: string, page?: number) => {
      setActiveOverlayId(overlayId);
      const region = overlayRegionById(overlays, overlayId);
      const targetPage = page ?? region?.page;
      if (targetPage) onViewerPageChange(targetPage);
      if (region?.kind === 'table') setSideTab('tables');
      else if (region?.kind === 'heading') setSideTab('outline');
      else if (region?.kind === 'field') setSideTab('fields');
      if (region?.blockIndex != null) {
        const block = blocks.find((b) => b.blockIndex === region.blockIndex);
        if (block) {
          const idx = blocks.indexOf(block);
          onActiveBlockIndexChange(idx >= 0 ? idx : null);
          onHighlightBlocks([block]);
        }
      }
    },
    [blocks, onActiveBlockIndexChange, onHighlightBlocks, onViewerPageChange, overlays]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeOverlayId) {
        setActiveOverlayId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [activeOverlayId]);

  const onPdfPageClick = useCallback(
    (page: number, nx: number, ny: number) => {
      if (overlayEnabled && overlays.length > 0) {
        const hit = hitTestLayoutOverlay(overlays, page, nx, ny);
        if (hit) {
          onOverlaySelect(hit.id, page);
          return;
        }
      }
      const index = findBlockIndexAtPoint(blocks, page, nx, ny);
      if (index < 0) return;
      const block = blocks[index];
      onActiveBlockIndexChange(index);
      onHighlightBlocks([block]);
      const irOverlay = overlayForExtractionBlock(overlays, block.blockIndex ?? index);
      if (irOverlay) setActiveOverlayId(irOverlay.id);
    },
    [blocks, onActiveBlockIndexChange, onHighlightBlocks, onOverlaySelect, overlayEnabled, overlays]
  );

  const highlights = useMemo(
    () =>
      highlightBlocks.map((b) => ({
        page: b.page,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
      })),
    [highlightBlocks]
  );

  const leftModeOptions = useMemo(
    () => [
      { value: 'original' as const, label: t('documents.layoutViewOriginal') },
      { value: 'text' as const, label: t('documents.layoutViewText') },
    ],
    [t]
  );

  const advancedViewOptions = useMemo(
    () => [
      { value: 'reconstruction' as const, label: t('documents.layoutViewReconstruction') },
      { value: 'compare' as const, label: t('documents.layoutViewCompare') },
    ],
    [t]
  );

  const layoutZoomOptions = useMemo(
    () =>
      LAYOUT_IR_ZOOM_STEPS.map((step) => ({
        value: String(step),
        label: `${String(step)}%`,
      })),
    []
  );

  const pending = layoutIrAvailable && layoutIrState === 'loading';
  const showAdvancedStage = advancedOpen && leftMode === 'original';
  const failed = doc.status === 'failed';
  const showRecovery =
    (failed || isExtractionPending(doc.status)) && onRequeueExtraction != null;

  return (
    <div className="layout-workspace">
      <div className="layout-workspace-main">
        <Card className="preview-card preview-card-pdf layout-viewer-card">
          <div className="layout-viewer-toolbar">
            <SegmentedControl<LeftDocumentMode>
              ariaLabel={t('documents.layoutViewModeAria')}
              className={segmentedToolbarClass('layout-view-mode-switch', 'segmented-control--text-wide')}
              value={leftMode}
              options={leftModeOptions}
              onChange={setLeftDocumentMode}
            />
            {leftMode === 'original' && !showAdvancedStage ? (
              <label className="layout-overlay-toggle">
                <input
                  type="checkbox"
                  checked={overlayEnabled}
                  onChange={(e) => { setOverlayEnabled(e.target.checked); }}
                />
                <span>{t('documents.layoutOverlayToggle')}</span>
              </label>
            ) : null}
            {showAdvancedStage || leftMode === 'text' ? (
              <SegmentedControl
                ariaLabel={t('documents.layoutZoomAria')}
                className={segmentedToolbarClass('layout-zoom-switch', 'segmented-control--zoom')}
                value={String(layoutZoom)}
                options={layoutZoomOptions}
                onChange={(value) => {
                  const next = LAYOUT_IR_ZOOM_STEPS.find((step) => String(step) === value);
                  if (next !== undefined) {
                    setLayoutZoom(next);
                  }
                }}
              />
            ) : null}
            {qualityTone !== 'unknown' ? (
              <span
                className={`layout-quality-badge layout-quality-badge-${qualityTone}${
                  showTechnicalDetails ? ' layout-quality-badge-technical' : ''
                }`}
                title={t('documents.layoutQualityTooltip')}
              >
                {qualityTone === 'good'
                  ? t('documents.layoutQualityGood')
                  : t('documents.layoutQualityReview', { page: qualityReviewPage ?? viewerPage })}
              </span>
            ) : null}
            {leftMode === 'text' ? (
              <div className="layout-viewer-toolbar-actions">
                <Button
                  type="button"
                  variant={editMode ? 'secondary' : 'ghost'}
                  aria-pressed={editMode}
                  onClick={() => { onEditModeChange(!editMode); }}
                >
                  {editMode ? t('documents.layoutTextEditDone') : t('documents.layoutTextEdit')}
                </Button>
              </div>
            ) : null}
          </div>

          <details
            className="layout-advanced-panel"
            open={advancedOpen}
            onToggle={(event) => {
              const open = event.currentTarget.open;
              setAdvancedOpen(open);
              if (open) {
                setLeftMode('original');
              }
            }}
          >
            <summary className="layout-advanced-summary">{t('documents.layoutAdvancedSummary')}</summary>
            <div className="layout-advanced-body">
              <SegmentedControl<AdvancedViewerMode>
                ariaLabel={t('documents.layoutAdvancedViewAria')}
                className={segmentedToolbarClass('layout-advanced-view-switch', 'segmented-control--text-wide')}
                value={advancedView}
                options={advancedViewOptions}
                onChange={setAdvancedView}
              />
              <div className="layout-advanced-export">
                <DocumentLayoutExportTab
                  documentId={doc.id}
                  documentTitle={doc.title || doc.filename}
                  hasLayoutIr={Boolean(layoutIr?.pages.length)}
                  markdown={doc.extraction?.markdown}
                  blocks={blocks}
                />
              </div>
            </div>
          </details>

          {showRecovery ? (
            <DocumentExtractionRecovery
              doc={doc}
              requeueBusy={requeueBusy}
              onRequeue={onRequeueExtraction}
              compact
            />
          ) : null}

          <div className="layout-viewer-stage">
            {leftMode === 'text' ? (
              <div className="layout-text-stage">
                <ExtractedTextPanel
                  documentId={doc.id}
                  fullText={doc.extraction?.text ?? ''}
                  markdown={doc.extraction?.markdown}
                  layoutIrAvailable={layoutIrAvailable}
                  layoutIrPages={layoutIrPages}
                  blocks={blocks}
                  activePage={viewerPage}
                  activeBlockIndex={activeBlockIndex}
                  pageSynced
                  editMode={editMode}
                  allowCopy
                  onActivePageChange={onViewerPageChange}
                  onHighlightBlocks={onHighlightBlocks}
                  onBlocksChange={onBlocksChange}
                  onActiveBlockIndexChange={onActiveBlockIndexChange}
                  documentTitle={doc.title || doc.filename}
                  textOnly
                />
                {blocksDirty ? (
                  <div className="layout-text-edit-save">
                    <Button type="button" variant="secondary" disabled={saving} onClick={onSaveBlocks}>
                      {saving ? t('documents.saving') : t('documents.save')}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : showAdvancedStage && advancedView === 'compare' && doc.id ? (
              <DocumentLayoutCompareView
                documentId={doc.id}
                pageCount={layoutPageCount}
                activePage={viewerPage}
                onPageChange={onViewerPageChange}
                showTechnicalDetails={showTechnicalDetails}
              />
            ) : showAdvancedStage && advancedView === 'reconstruction' && frameLayoutIr && doc.id ? (
              <ExtractedLayoutHtmlFrame
                documentId={doc.id}
                layoutIr={frameLayoutIr}
                activePage={viewerPage}
                pageSynced
                pageCount={layoutPageCount}
                zoom={layoutZoom}
                requeueBusy={requeueBusy}
                onRequeueExtraction={onRequeueExtraction}
                suspendHtmlFetch={pending}
              />
            ) : (
              <>
                {previewUnavailable ? (
                  <p className="muted">{t('documents.previewUnavailable')}</p>
                ) : previewLoading || !previewData ? (
                  <p className="muted">{t('documents.previewLoading')}</p>
                ) : (
                  <PdfViewer
                    data={previewData}
                    highlightBlocks={highlights}
                    layoutOverlays={pdfOverlays}
                    layoutOverlayEnabled={overlayEnabled && overlays.length > 0}
                    activeLayoutOverlayId={activeOverlayId}
                    onLayoutOverlaySelect={(id) => { onOverlaySelect(id); }}
                    onLayoutOverlayHover={setHoverOverlay}
                    onLayoutOverlayClear={() => { setActiveOverlayId(null); }}
                    page={viewerPage}
                    onPageChange={onViewerPageChange}
                    paginated
                    fitWidth
                    onPageClick={onPdfPageClick}
                  />
                )}
                {hoverOverlay && overlayEnabled ? (
                  <div className="layout-overlay-popover" role="tooltip">
                    <span className={`layout-overlay-kind layout-overlay-kind-${hoverOverlay.kind}`}>
                      {t(`documents.layoutOverlayKind.${hoverOverlay.kind}`)}
                    </span>
                    <p className="layout-overlay-popover-label">{hoverOverlay.label}</p>
                    {hoverOverlay.value ? (
                      <p className="layout-overlay-popover-value">{hoverOverlay.value}</p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Card>
      </div>

      {layoutIr ? (
        <DocumentLayoutSidePanel
          documentId={doc.id}
          layoutIr={layoutIr}
          fields={fields}
          blocks={blocks}
          knownFieldKeys={knownFieldKeys}
          fieldLabelForKey={fieldLabelForKey}
          activeTab={sideTab}
          onTabChange={setSideTab}
          activeOverlayId={activeOverlayId}
          onOverlaySelect={onOverlaySelect}
          onAcceptSuggestion={(key, value) => {
            onAcceptFieldSuggestion(key, value);
            setDismissedSuggestions((prev) => new Set(prev).add(key));
          }}
          onDismissSuggestion={(key) => { setDismissedSuggestions((prev) => new Set(prev).add(key)); }
          }
          dismissedSuggestions={dismissedSuggestions}
          heuristicSuggestions={heuristicSuggestions}
          documentChatAvailable={documentChatAvailable}
          documentChatUiEnabled={documentChatUiEnabled}
        />
      ) : (
        <aside className="layout-side-panel layout-side-panel-loading">
          <p className="muted">{t('documents.layoutIrLoading')}</p>
        </aside>
      )}
    </div>
  );
}
