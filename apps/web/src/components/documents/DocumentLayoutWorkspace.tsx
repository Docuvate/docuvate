// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DocumentDto, ExtractedField, ExtractionBlock } from '@docuvate/contracts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PdfViewer, type PdfLayoutOverlay } from './PdfViewer';
import { ExtractedLayoutHtmlFrame, LAYOUT_IR_ZOOM_STEPS, type LayoutIrZoomStep } from './ExtractedLayoutHtmlFrame';
import { DocumentLayoutSidePanel, type LayoutSideTab, overlayRegionById } from './DocumentLayoutSidePanel';
import {
  buildLayoutOverlays,
  hitTestLayoutOverlay,
  overlayForExtractionBlock,
} from '../../lib/layoutOverlayModel';
import { useDocumentLayoutIr } from '../../lib/useDocumentLayoutIr';
import { layoutIrDocumentFromPageSummaries } from '../../lib/layoutIrPages';
import { findBlockIndexAtPoint } from '../../lib/extractionLayout';
import { DocumentExtractionRecovery } from './DocumentExtractionRecovery';
import { isExtractionPending } from '../../lib/documentExtractionState';
import { ExtractedTextPanel } from './ExtractedTextPanel';
import { DocumentLayoutCompareView } from './DocumentLayoutCompareView';

type ViewerMode = 'original' | 'reconstruction' | 'compare';

interface DocumentLayoutWorkspaceProps {
  doc: DocumentDto;
  previewData: ArrayBuffer | null;
  previewLoading: boolean;
  previewUnavailable: boolean;
  blocks: ExtractionBlock[];
  fields: ExtractedField[];
  heuristicSuggestions?: Array<{ key: string; value: string }>;
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
}: DocumentLayoutWorkspaceProps) {
  const { t } = useTranslation();
  const layoutIrAvailable = doc.extraction?.layoutIrAvailable === true;
  const layoutIrPages = doc.extraction?.layoutIrPages;
  const { layoutIr, state: layoutIrState } = useDocumentLayoutIr(
    doc.id,
    layoutIrAvailable,
    layoutIrPages
  );

  const [viewerMode, setViewerMode] = useState<ViewerMode>('original');
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [sideTab, setSideTab] = useState<LayoutSideTab>('fields');
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [hoverOverlay, setHoverOverlay] = useState<PdfLayoutOverlay | null>(null);
  const [layoutZoom, setLayoutZoom] = useState<LayoutIrZoomStep>(100);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => new Set());

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
    return () => window.removeEventListener('keydown', onKey);
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
      if (!block) return;
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

  const layoutPageCount = layoutIr?.pages.length ?? layoutIrPages?.length ?? 1;
  const pending = layoutIrAvailable && layoutIrState === 'loading';
  const failed = doc.status === 'failed';
  const showRecovery =
    (failed || isExtractionPending(doc.status)) && onRequeueExtraction != null;

  return (
    <div className="layout-workspace">
      <div className="layout-workspace-main">
        <Card className="preview-card preview-card-pdf layout-viewer-card">
          <div className="layout-viewer-toolbar">
            <div className="layout-view-mode-switch" role="group" aria-label={t('documents.layoutViewModeAria')}>
              <button
                type="button"
                className={`layout-view-mode-btn${viewerMode === 'original' ? ' layout-view-mode-btn-active' : ''}`}
                aria-pressed={viewerMode === 'original'}
                onClick={() => setViewerMode('original')}
              >
                {t('documents.layoutViewOriginal')}
              </button>
              <button
                type="button"
                className={`layout-view-mode-btn${viewerMode === 'reconstruction' ? ' layout-view-mode-btn-active' : ''}`}
                aria-pressed={viewerMode === 'reconstruction'}
                onClick={() => setViewerMode('reconstruction')}
              >
                {t('documents.layoutViewReconstruction')}
              </button>
              <button
                type="button"
                className={`layout-view-mode-btn${viewerMode === 'compare' ? ' layout-view-mode-btn-active' : ''}`}
                aria-pressed={viewerMode === 'compare'}
                onClick={() => setViewerMode('compare')}
              >
                {t('documents.layoutViewCompare')}
              </button>
            </div>
            {viewerMode === 'original' ? (
              <label className="layout-overlay-toggle">
                <input
                  type="checkbox"
                  checked={overlayEnabled}
                  onChange={(e) => setOverlayEnabled(e.target.checked)}
                />
                <span>{t('documents.layoutOverlayToggle')}</span>
              </label>
            ) : (
              <div className="layout-zoom-switch" role="group" aria-label={t('documents.layoutZoomAria')}>
                {LAYOUT_IR_ZOOM_STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`layout-zoom-btn${layoutZoom === step ? ' layout-zoom-btn-active' : ''}`}
                    onClick={() => setLayoutZoom(step)}
                  >
                    {step}%
                  </button>
                ))}
              </div>
            )}
            <div className="layout-viewer-toolbar-actions">
              <Button
                type="button"
                variant={textEditOpen ? 'secondary' : 'ghost'}
                aria-pressed={textEditOpen}
                onClick={() => {
                  onTextEditOpenChange(!textEditOpen);
                  onEditModeChange(!textEditOpen);
                }}
              >
                {textEditOpen ? t('documents.layoutTextEditDone') : t('documents.layoutTextEdit')}
              </Button>
            </div>
          </div>

          {showRecovery && onRequeueExtraction ? (
            <DocumentExtractionRecovery
              doc={doc}
              requeueBusy={requeueBusy}
              onRequeue={onRequeueExtraction}
              compact
            />
          ) : null}

          <div className="layout-viewer-stage">
            {viewerMode === 'original' ? (
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
                    onLayoutOverlaySelect={(id) => onOverlaySelect(id)}
                    onLayoutOverlayHover={setHoverOverlay}
                    onLayoutOverlayClear={() => setActiveOverlayId(null)}
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
            ) : viewerMode === 'compare' && doc.id ? (
              <DocumentLayoutCompareView
                documentId={doc.id}
                pageCount={layoutPageCount}
                activePage={viewerPage}
                onPageChange={onViewerPageChange}
              />
            ) : frameLayoutIr && doc.id ? (
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
              <p className="muted">{t('documents.layoutIrLoading')}</p>
            )}
          </div>
        </Card>

        {textEditOpen ? (
          <Card className="layout-text-edit-panel">
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
              documentTitle={doc.title ?? doc.filename}
              textOnly
            />
            {blocksDirty ? (
              <div className="layout-text-edit-save">
                <Button type="button" variant="secondary" disabled={saving} onClick={onSaveBlocks}>
                  {saving ? t('documents.saving') : t('documents.save')}
                </Button>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>

      {layoutIr ? (
        <DocumentLayoutSidePanel
          documentId={doc.id}
          documentTitle={doc.title ?? doc.filename}
          layoutIr={layoutIr}
          fields={fields}
          blocks={blocks}
          markdown={doc.extraction?.markdown}
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
          onDismissSuggestion={(key) =>
            setDismissedSuggestions((prev) => new Set(prev).add(key))
          }
          dismissedSuggestions={dismissedSuggestions}
          heuristicSuggestions={heuristicSuggestions}
        />
      ) : (
        <aside className="layout-side-panel layout-side-panel-loading">
          <p className="muted">{t('documents.layoutIrLoading')}</p>
        </aside>
      )}
    </div>
  );
}
