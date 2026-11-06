// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ApplyFieldCorrectionRequest,
  ApplyTableCorrectionRequest,
  DocumentDto,
  ExtractedField,
  ExtractionBlock,
  RecognizedFieldDefinitionDto,
} from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  applyDocumentFieldCorrection,
  applyDocumentTableCorrection,
  confirmDocumentField,
  withdrawDocumentFieldCorrection,
  withdrawDocumentTableCorrection,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { isExtractionPending } from '../../lib/documentExtractionState';
import { withSavedFieldValue } from '../../lib/documentFieldValueRowState';
import { findBlockIndexAtPoint } from '../../lib/extractionLayout';
import { findFieldRegion } from '../../lib/findFieldRegion';
import { layoutIrDocumentFromPageSummaries } from '../../lib/layoutIrPages';
import {
  buildLayoutOverlays,
  hitTestLayoutOverlay,
  type LayoutOverlayRegion,
  overlayForExtractionBlock,
} from '../../lib/layoutOverlayModel';
import {
  firstPageBelowSsimFloor,
  reconstructionQualityTone,
} from '../../lib/layoutReconstructionQuality';
import { useFeatureFlags } from '../../lib/remoteConfig';
import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { sourceChipPageLabel } from '../../lib/sourceChipLabel';
import type { TableStructureChoice } from '../../lib/tableLayouts';
import { useDocumentLayoutIr } from '../../lib/useDocumentLayoutIr';
import { useDocumentRegionLayers } from '../../lib/useDocumentRegionLayers';
import { useLayoutCompare } from '../../lib/useLayoutCompare';
import { useViewportMaxWidth } from '../../lib/useViewportMaxWidth';
import { useToast } from '../save';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DocumentExtractionRecovery } from './DocumentExtractionRecovery';
import { DocumentFieldContextBar } from './DocumentFieldContextBar';
import { DocumentFieldCorrectionSheet } from './DocumentFieldCorrectionSheet';
import { DocumentFieldMarkHint, useDocumentFieldMarking } from './DocumentFieldMarkHint';
import { DocumentLayoutCompareView } from './DocumentLayoutCompareView';
import { DocumentLayoutExportTab } from './DocumentLayoutExportTab';
import { DocumentLayoutPaneTabs, useLayoutMobilePane } from './DocumentLayoutPaneTabs';
import {
  DocumentLayoutSidePanel,
  type LayoutSideTab,
  overlayRegionById,
} from './DocumentLayoutSidePanel';
import { DocumentLayoutViewerToolbar, type LeftDocumentMode } from './DocumentLayoutViewerToolbar';
import { type DocumentSelectionDraft, DocumentSelectionLayer } from './DocumentSelectionLayer';
import type { DocumentSelectionTool } from './DocumentSelectionTools';
import { DocumentTableCorrectionSheet } from './DocumentTableCorrectionSheet';
import { ExtractedLayoutHtmlFrame, type LayoutIrZoomStep } from './ExtractedLayoutHtmlFrame';
import { ExtractedTextPanel } from './ExtractedTextPanel';
import { type PdfLayoutOverlay, PdfViewer } from './PdfViewer';

type AdvancedViewerMode = 'reconstruction' | 'compare';

const REGION_FIELD_OVERLAY_PREFIX = 'region-field-';
const REGION_TABLE_OVERLAY_PREFIX = 'region-table-';
const CORRECTION_SHEET_MAX_WIDTH_PX = 1023;

function regionFieldOverlayId(regionId: string): string {
  return `${REGION_FIELD_OVERLAY_PREFIX}${regionId}`;
}

function regionIdFromFieldOverlay(overlayId: string): string | null {
  if (!overlayId.startsWith(REGION_FIELD_OVERLAY_PREFIX)) {
    return null;
  }
  return overlayId.slice(REGION_FIELD_OVERLAY_PREFIX.length);
}

function regionTableOverlayId(regionId: string): string {
  return `${REGION_TABLE_OVERLAY_PREFIX}${regionId}`;
}

function regionIdFromTableOverlay(overlayId: string): string | null {
  if (!overlayId.startsWith(REGION_TABLE_OVERLAY_PREFIX)) {
    return null;
  }
  return overlayId.slice(REGION_TABLE_OVERLAY_PREFIX.length);
}

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
  /** Saves a typed field value (recorded as a correction). */
  onSaveFieldValue?: (key: string, value: string) => void;
  onFieldsChange?: (fields: ExtractedField[]) => void;
  recognizedCatalog?: RecognizedFieldDefinitionDto[];
  editMode: boolean;
  onEditModeChange: (edit: boolean) => void;
  blocksDirty: boolean;
  saving: boolean;
  onSaveBlocks: () => void;
  requeueBusy?: boolean;
  onRequeueExtraction?: () => void;
  textEditOpen: boolean;
  onTextEditOpenChange: (open: boolean) => void;
  showTechnicalDetails?: boolean;
  layoutSideTab: LayoutSideTab;
  onLayoutSideTabChange: (tab: LayoutSideTab) => void;
  onCorrectionSheetOpenChange?: (open: boolean) => void;
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
  onSaveFieldValue,
  onFieldsChange,
  recognizedCatalog = [],
  editMode,
  onEditModeChange,
  blocksDirty,
  saving,
  onSaveBlocks,
  requeueBusy = false,
  onRequeueExtraction,
  textEditOpen,
  onTextEditOpenChange,
  showTechnicalDetails = false,
  layoutSideTab,
  onLayoutSideTabChange,
  onCorrectionSheetOpenChange,
}: DocumentLayoutWorkspaceProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const correctionSheetViewport = useViewportMaxWidth(CORRECTION_SHEET_MAX_WIDTH_PX);
  const layoutIrAvailable = doc.extraction?.layoutIrAvailable === true;
  const layoutIrPages = doc.extraction?.layoutIrPages;
  const { layoutIr, state: layoutIrState } = useDocumentLayoutIr(
    doc.id,
    layoutIrAvailable,
    layoutIrPages
  );

  const featureFlags = useFeatureFlags();
  const layoutAdvancedEnabled = featureFlags.layoutReconstructionCompare;

  const [leftMode, setLeftMode] = useState<LeftDocumentMode>('original');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedView, setAdvancedView] = useState<AdvancedViewerMode>('reconstruction');
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [displayRotationDeg, setDisplayRotationDeg] = useState<0 | 90 | 180 | 270>(0);
  const rotateClockwise = useCallback(() => {
    setDisplayRotationDeg((prev) => (prev === 270 ? 0 : prev === 0 ? 90 : prev === 90 ? 180 : 270));
  }, []);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [hoverOverlay, setHoverOverlay] = useState<PdfLayoutOverlay | null>(null);
  const [layoutZoom, setLayoutZoom] = useState<LayoutIrZoomStep>(100);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => new Set());
  const [selectionTool, setSelectionTool] = useState<DocumentSelectionTool>('none');
  const [selectionDraft, setSelectionDraft] = useState<DocumentSelectionDraft | null>(null);
  const [reanchorFieldKey, setReanchorFieldKey] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  /** Changes whenever the stored layout IR can have changed (reprocess finished, status flip). */
  const layoutIrRevision = `${doc.status}:${doc.updatedAt}:${String(layoutIrAvailable)}`;
  const { layoutTokens, fieldRegions, tableRegions, refreshRegions } = useDocumentRegionLayers(
    doc.id,
    viewerPage,
    layoutIrRevision
  );

  const fieldOptions = useMemo(() => {
    const keys = new Set<string>(knownFieldKeys);
    for (const field of fields) {
      if (field.key.startsWith('suggestion:')) {
        continue;
      }
      keys.add(field.key);
    }
    return [...keys]
      .map((key) => ({
        value: key,
        label: fieldLabelForKey(key),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de-DE'));
  }, [fieldLabelForKey, fields, knownFieldKeys]);

  const existingFieldValues = useMemo(() => {
    const values = new Map<string, string>();
    for (const field of fields) {
      if (field.key.startsWith('suggestion:')) {
        continue;
      }
      values.set(field.key, field.value);
    }
    return values;
  }, [fields]);

  const highlightRegion = useCallback(
    (key: string) => {
      const region = findFieldRegion(key, fieldRegions);
      if (!region) {
        return;
      }
      setActiveOverlayId(regionFieldOverlayId(region.id));
      onViewerPageChange(region.page);
      const matched = blocks.filter(
        (block) =>
          block.page === region.page &&
          block.blockIndex != null &&
          region.blockIndexes.includes(block.blockIndex)
      );
      if (matched.length > 0) {
        onHighlightBlocks(matched);
      }
    },
    [blocks, fieldRegions, onHighlightBlocks, onViewerPageChange]
  );

  const confirmField = useCallback(
    (key: string, value: string) => {
      void confirmDocumentField(doc.id, key, value)
        .then(() => {
          onFieldsChange?.(withSavedFieldValue(fields, key, value));
          toast.success(t('documents.fieldConfirmedToast'));
          highlightRegion(key);
        })
        .catch((err: unknown) => {
          toast.error(formatUserFacingError(err, 'errors.generic'));
        });
    },
    [doc.id, fields, highlightRegion, onFieldsChange, t, toast]
  );

  const tableSheetOpen = Boolean(correctionSheetViewport && selectedTableId);
  const correctionSheetOpen = Boolean(
    correctionSheetViewport && (selectedFieldKey ?? selectedTableId)
  );
  const mobilePane = useLayoutMobilePane(correctionSheetOpen);
  const fieldMarking = useDocumentFieldMarking({
    setReanchorFieldKey,
    setSelectionDraft,
    setSelectionTool,
    highlightRegion,
    sheetFieldKey: selectedFieldKey,
    closeSheet: () => {
      setSelectedFieldKey(null);
    },
    onSaveFieldValue,
    revealViewer: mobilePane.showDocument,
  });

  const selectField = useCallback(
    (key: string) => {
      setSelectedFieldKey(key);
      highlightRegion(key);
      onLayoutSideTabChange('fields');
    },
    [highlightRegion, onLayoutSideTabChange]
  );

  useEffect(() => {
    onCorrectionSheetOpenChange?.(correctionSheetOpen);
    return () => {
      onCorrectionSheetOpenChange?.(false);
    };
  }, [correctionSheetOpen, onCorrectionSheetOpenChange]);

  const runFieldCorrection = useCallback(
    async (body: ApplyFieldCorrectionRequest, successMessage: string) => {
      const result = await applyDocumentFieldCorrection(doc.id, body);
      await refreshRegions();
      if (result?.region?.field) {
        const nextValue =
          result.correction?.newValue ??
          result.region.field.valueOverride ??
          selectionDraft?.text ??
          '';
        const fieldKey = result.region.field.fieldKey;
        setSelectedFieldKey(fieldKey);
        setActiveOverlayId(regionFieldOverlayId(result.region.id));
        if (onFieldsChange) {
          const exists = fields.some((field) => field.key === fieldKey);
          onFieldsChange(
            exists
              ? fields.map((field) =>
                  field.key === fieldKey
                    ? {
                        ...field,
                        value: nextValue || field.value,
                        confidence: 1,
                        userConfirmed: true,
                      }
                    : field
                )
              : [...fields, { key: fieldKey, value: nextValue, confidence: 1, userConfirmed: true }]
          );
        }
      }
      if (result?.correction) {
        const correctionId = result.correction.id;
        toast.success(successMessage, {
          undo: () => {
            void withdrawDocumentFieldCorrection(doc.id, correctionId)
              .then(() => refreshRegions())
              .catch((err: unknown) => {
                toast.error(formatUserFacingError(err, 'errors.generic'));
              });
          },
        });
      }
      setSelectionDraft(null);
      setSelectionTool('none');
      setReanchorFieldKey(null);
    },
    [doc.id, fields, onFieldsChange, refreshRegions, selectionDraft?.text, toast]
  );

  const runTableCorrection = useCallback(
    async (body: ApplyTableCorrectionRequest, successMessage: string) => {
      const result = await applyDocumentTableCorrection(doc.id, body);
      await refreshRegions();
      if (result?.region?.id) {
        setSelectedTableId(result.region.id);
        setSelectedFieldKey(null);
        setActiveOverlayId(regionTableOverlayId(result.region.id));
        onLayoutSideTabChange('tables');
      }
      if (result?.correction) {
        const correctionId = result.correction.id;
        toast.success(successMessage, {
          undo: () => {
            void withdrawDocumentTableCorrection(doc.id, correctionId)
              .then(() => refreshRegions())
              .catch((err: unknown) => {
                toast.error(formatUserFacingError(err, 'errors.generic'));
              });
          },
        });
      }
      setSelectionDraft(null);
      setSelectionTool('none');
    },
    [doc.id, onLayoutSideTabChange, refreshRegions, toast]
  );

  const submitTableCorrection = useCallback(
    (body: ApplyTableCorrectionRequest, message = t('documents.tableCorrectionSaved')) => {
      runTableCorrection(body, message).catch((err: unknown) => {
        toast.error(formatUserFacingError(err, 'errors.generic'));
      });
    },
    [runTableCorrection, t, toast]
  );

  const applyTableLayoutChoice = (regionId: string, choice: TableStructureChoice) => {
    submitTableCorrection(
      { id: crypto.randomUUID(), op: 'set_headers', beforeRegionId: regionId, ...choice },
      t('tableLayouts.applied')
    );
  };

  const layoutPageCount = layoutIr?.pages.length ?? layoutIrPages?.length ?? 1;
  const { metricsByPage, metrics: compareMetrics } = useLayoutCompare(
    doc.id,
    layoutAdvancedEnabled && layoutIrAvailable && Boolean(doc.id),
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

  const setLeftDocumentMode = useCallback((mode: LeftDocumentMode) => {
    setLeftMode(mode);
    if (mode === 'text') {
      setAdvancedOpen(false);
    }
  }, []);

  const frameLayoutIr =
    layoutIr ?? (layoutIrPages?.length ? layoutIrDocumentFromPageSummaries(layoutIrPages) : null);

  const overlays = useMemo(() => {
    const base = layoutIr ? buildLayoutOverlays(layoutIr) : [];
    const corrected: LayoutOverlayRegion[] = tableRegions.map((region, index) => ({
      id: `region-table-${region.id}`,
      page: region.page,
      x: region.x0,
      y: region.y0,
      width: Math.max(0, region.x1 - region.x0),
      height: Math.max(0, region.y1 - region.y0),
      kind: 'table',
      label: String(index + 1),
      tableIndex: 1000 + index,
    }));
    return [...base, ...corrected];
  }, [layoutIr, tableRegions]);

  const pdfOverlays: PdfLayoutOverlay[] = useMemo(() => {
    const fromIr = overlays.map((o) => {
      let label = o.label;
      if (o.id.startsWith('region-table-')) {
        label = t('documents.layoutCorrectedTableLabel', { n: o.label });
      } else if (o.kind === 'table' && o.tableIndex != null) {
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
    });
    const fromRegions: PdfLayoutOverlay[] = fieldRegions.map((region) => {
      const fieldKey = region.field?.fieldKey ?? '';
      return {
        id: regionFieldOverlayId(region.id),
        page: region.page,
        x: region.x0,
        y: region.y0,
        width: Math.max(0, region.x1 - region.x0),
        height: Math.max(0, region.y1 - region.y0),
        kind: 'field',
        label: fieldKey ? fieldLabelForKey(fieldKey) : t('documents.layoutOverlayKind.field'),
        value: region.field?.valueOverride ?? undefined,
      };
    });
    return [...fromIr, ...fromRegions];
  }, [fieldLabelForKey, fieldRegions, overlays, t]);

  const onOverlaySelect = useCallback(
    (overlayId: string, page?: number) => {
      setActiveOverlayId(overlayId);
      const regionId = regionIdFromFieldOverlay(overlayId);
      if (regionId) {
        const fieldRegion = fieldRegions.find((item) => item.id === regionId);
        const fieldKey = fieldRegion?.field?.fieldKey;
        if (fieldKey) {
          setSelectedFieldKey(fieldKey);
          setSelectedTableId(null);
          onLayoutSideTabChange('fields');
        }
        if (fieldRegion) {
          onViewerPageChange(fieldRegion.page);
        }
        return;
      }
      const tableId = regionIdFromTableOverlay(overlayId);
      if (tableId) {
        setSelectedTableId(tableId);
        setSelectedFieldKey(null);
        onLayoutSideTabChange('tables');
        const tableRegion = tableRegions.find((item) => item.id === tableId);
        if (tableRegion) {
          onViewerPageChange(tableRegion.page);
        }
        return;
      }
      const region = overlayRegionById(overlays, overlayId);
      const targetPage = page ?? region?.page;
      if (targetPage) onViewerPageChange(targetPage);
      if (region?.kind === 'table') onLayoutSideTabChange('tables');
      else if (region?.kind === 'heading') onLayoutSideTabChange('outline');
      else if (region?.kind === 'field') onLayoutSideTabChange('fields');
      if (region?.blockIndex != null) {
        const block = blocks.find((b) => b.blockIndex === region.blockIndex);
        if (block) {
          const idx = blocks.indexOf(block);
          onActiveBlockIndexChange(idx >= 0 ? idx : null);
          onHighlightBlocks([block]);
        }
      }
    },
    [
      blocks,
      fieldRegions,
      tableRegions,
      onActiveBlockIndexChange,
      onHighlightBlocks,
      onLayoutSideTabChange,
      onViewerPageChange,
      overlays,
    ]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === 'Escape') {
        setActiveOverlayId(null);
        setSelectionDraft(null);
        setSelectionTool('none');
        setReanchorFieldKey(null);
        setSelectedFieldKey(null);
        setSelectedTableId(null);
        return;
      }
      if (event.key === 't' || event.key === 'T') {
        setSelectionTool('text');
        return;
      }
      if (event.key === 'r' || event.key === 'R') {
        setSelectionTool('rect');
        return;
      }
      if (event.key === 'Enter' && selectionDraft && reanchorFieldKey) {
        // Free-form create/assign goes through DocumentFieldContextBar so the user
        // picks the target field explicitly (and confirms overwrites).
        event.preventDefault();
        void runFieldCorrection(
          {
            id: crypto.randomUUID(),
            op: 'reanchor',
            fieldKey: reanchorFieldKey,
            page: selectionDraft.page,
            shape: 'rect',
            x0: selectionDraft.rect.x0,
            y0: selectionDraft.rect.y0,
            x1: selectionDraft.rect.x1,
            y1: selectionDraft.rect.y1,
            blockIndexes: selectionDraft.tokens.map((token) => token.blockIndex),
            ...(selectionDraft.text.trim().length > 0
              ? { valueOverride: selectionDraft.text }
              : {}),
          },
          t('documents.fieldCorrectionSaved', { name: fieldLabelForKey(reanchorFieldKey) })
        ).catch((err: unknown) => {
          toast.error(formatUserFacingError(err, 'errors.generic'));
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [
    activeOverlayId,
    fieldLabelForKey,
    reanchorFieldKey,
    runFieldCorrection,
    selectionDraft,
    t,
    toast,
  ]);

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

  const advancedViewOptions = useMemo(
    () => [
      { value: 'reconstruction' as const, label: t('documents.layoutViewReconstruction') },
      { value: 'compare' as const, label: t('documents.layoutViewCompare') },
    ],
    [t]
  );

  const pending = layoutIrAvailable && layoutIrState === 'loading';
  const showAdvancedStage = layoutAdvancedEnabled && advancedOpen && leftMode === 'original';
  const failed = doc.status === 'failed';
  const showRecovery = (failed || isExtractionPending(doc.status)) && onRequeueExtraction != null;
  const selectedField = selectedFieldKey
    ? fields.find((field) => field.key === selectedFieldKey)
    : undefined;
  const selectedRegion = selectedFieldKey
    ? findFieldRegion(selectedFieldKey, fieldRegions)
    : undefined;

  return (
    <div
      className={
        correctionSheetOpen
          ? 'layout-workspace layout-workspace--correction-sheet'
          : 'layout-workspace'
      }
      data-correction-sheet-viewport={correctionSheetViewport ? '1' : '0'}
      data-selected-field={selectedFieldKey ?? ''}
      data-selected-table={selectedTableId ?? ''}
      data-mobile-pane={mobilePane.narrow ? mobilePane.pane : undefined}
    >
      {mobilePane.narrow ? (
        <DocumentLayoutPaneTabs pane={mobilePane.pane} onPaneChange={mobilePane.setPane} />
      ) : null}
      <div className="layout-workspace-main">
        <Card className="preview-card preview-card-pdf layout-viewer-card">
          {showRecovery ? (
            <DocumentExtractionRecovery
              doc={doc}
              requeueBusy={requeueBusy}
              onRequeue={onRequeueExtraction}
              compact
            />
          ) : null}

          <DocumentLayoutViewerToolbar
            leftMode={leftMode}
            onLeftModeChange={setLeftDocumentMode}
            showAdvancedStage={showAdvancedStage}
            selectionTool={selectionTool}
            onSelectionToolChange={setSelectionTool}
            zoom={layoutZoom}
            onZoomChange={setLayoutZoom}
            showTechnicalDetails={showTechnicalDetails}
            qualityTone={qualityTone}
            qualityPage={qualityReviewPage ?? viewerPage}
            editMode={editMode}
            onEditModeChange={onEditModeChange}
            overlay={
              pdfOverlays.length > 0 && leftMode === 'original'
                ? { enabled: overlayEnabled, onChange: setOverlayEnabled }
                : undefined
            }
            onRotate={leftMode === 'original' && !showAdvancedStage ? rotateClockwise : undefined}
          />

          <DocumentFieldMarkHint
            fieldKey={reanchorFieldKey}
            fieldLabelForKey={fieldLabelForKey}
            selectionTool={selectionTool}
            hasDraft={selectionDraft !== null}
            onCancel={fieldMarking.cancelMarkingField}
          />
          <div
            className="layout-viewer-stage"
            data-testid="layout-viewer-stage"
            ref={fieldMarking.viewerStageRef}
          >
            {leftMode === 'text' ? (
              <div className="layout-text-stage">
                <ExtractedTextPanel
                  documentId={doc.id}
                  fullText={doc.extraction?.text ?? ''}
                  layoutIrAvailable={layoutIrAvailable}
                  layoutIrDocument={layoutIr}
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={saving}
                      onClick={onSaveBlocks}
                    >
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
            ) : showAdvancedStage &&
              advancedView === 'reconstruction' &&
              frameLayoutIr &&
              doc.id ? (
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
                    layoutOverlayEnabled={overlayEnabled && pdfOverlays.length > 0}
                    activeLayoutOverlayId={activeOverlayId}
                    onLayoutOverlaySelect={(id) => {
                      onOverlaySelect(id);
                    }}
                    onLayoutOverlayHover={setHoverOverlay}
                    onLayoutOverlayClear={() => {
                      setActiveOverlayId(null);
                    }}
                    page={viewerPage}
                    onPageChange={onViewerPageChange}
                    paginated
                    fitWidth
                    onPageClick={selectionTool === 'none' ? onPdfPageClick : undefined}
                    displayRotationDeg={displayRotationDeg}
                  />
                )}
                {!showAdvancedStage ? (
                  <DocumentSelectionLayer
                    tool={selectionTool}
                    page={viewerPage}
                    tokens={layoutTokens}
                    onDraftChange={setSelectionDraft}
                  />
                ) : null}
                {selectionDraft ? (
                  <DocumentFieldContextBar
                    draft={selectionDraft}
                    fieldOptions={
                      reanchorFieldKey
                        ? [
                            {
                              value: reanchorFieldKey,
                              label: fieldLabelForKey(reanchorFieldKey),
                            },
                          ]
                        : fieldOptions
                    }
                    existingFieldValues={existingFieldValues}
                    onMarkTable={
                      reanchorFieldKey
                        ? undefined
                        : () => {
                            submitTableCorrection({
                              id: crypto.randomUUID(),
                              op: 'create',
                              page: selectionDraft.page,
                              shape: 'rect',
                              x0: selectionDraft.rect.x0,
                              y0: selectionDraft.rect.y0,
                              x1: selectionDraft.rect.x1,
                              y1: selectionDraft.rect.y1,
                              blockIndexes: selectionDraft.tokens.map((token) => token.blockIndex),
                            });
                          }
                    }
                    onConfirm={(fieldKey) => {
                      void runFieldCorrection(
                        {
                          id: crypto.randomUUID(),
                          op: reanchorFieldKey ? 'reanchor' : 'create',
                          fieldKey,
                          page: selectionDraft.page,
                          shape: 'rect',
                          x0: selectionDraft.rect.x0,
                          y0: selectionDraft.rect.y0,
                          x1: selectionDraft.rect.x1,
                          y1: selectionDraft.rect.y1,
                          blockIndexes: selectionDraft.tokens.map((token) => token.blockIndex),
                          ...(selectionDraft.text.trim().length > 0
                            ? { valueOverride: selectionDraft.text }
                            : {}),
                        },
                        t('documents.fieldCorrectionSaved', { name: fieldLabelForKey(fieldKey) })
                      ).catch((err: unknown) => {
                        toast.error(formatUserFacingError(err, 'errors.generic'));
                      });
                    }}
                    onCancel={() => {
                      setSelectionDraft(null);
                      setReanchorFieldKey(null);
                    }}
                  />
                ) : null}
                {hoverOverlay && overlayEnabled ? (
                  <div className="layout-overlay-popover" role="tooltip">
                    <span
                      className={`layout-overlay-kind layout-overlay-kind-${hoverOverlay.kind}`}
                    >
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

          {layoutAdvancedEnabled ? (
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
              <summary className="layout-advanced-summary">
                {t('documents.layoutAdvancedSummary')}
              </summary>
              <div className="layout-advanced-body">
                <SegmentedControl<AdvancedViewerMode>
                  ariaLabel={t('documents.layoutAdvancedViewAria')}
                  className={segmentedToolbarClass(
                    'layout-advanced-view-switch',
                    'segmented-control--text-wide'
                  )}
                  value={advancedView}
                  options={advancedViewOptions}
                  onChange={setAdvancedView}
                />
                <div className="layout-advanced-export">
                  <DocumentLayoutExportTab
                    documentId={doc.id}
                    documentTitle={doc.title || doc.filename}
                    hasLayoutIr={Boolean(layoutIr?.pages.length)}
                    blocks={blocks}
                  />
                </div>
              </div>
            </details>
          ) : null}
        </Card>
      </div>

      {layoutIr ? (
        <DocumentLayoutSidePanel
          layoutIr={layoutIr}
          fields={fields}
          knownFieldKeys={knownFieldKeys}
          fieldLabelForKey={fieldLabelForKey}
          activeTab={layoutSideTab}
          onTabChange={(tab) => {
            onLayoutSideTabChange(tab);
            if (
              tab === 'tables' &&
              correctionSheetViewport &&
              tableRegions.length > 0 &&
              !selectedTableId
            ) {
              setSelectedTableId(tableRegions[0].id);
              setSelectedFieldKey(null);
            }
          }}
          activeOverlayId={activeOverlayId}
          onOverlaySelect={onOverlaySelect}
          onAcceptSuggestion={(key, value) => {
            onAcceptFieldSuggestion(key, value);
            setDismissedSuggestions((prev) => new Set(prev).add(key));
          }}
          onDismissSuggestion={(key) => {
            setDismissedSuggestions((prev) => new Set(prev).add(key));
          }}
          dismissedSuggestions={dismissedSuggestions}
          heuristicSuggestions={heuristicSuggestions}
          recognizedCatalog={recognizedCatalog}
          fieldRegions={fieldRegions}
          tableRegions={tableRegions}
          onTableLayoutApply={applyTableLayoutChoice}
          onTableCellChange={(regionId, row, col, text) => {
            submitTableCorrection({
              id: crypto.randomUUID(),
              op: 'edit_cell',
              beforeRegionId: regionId,
              cell: { row, col, text },
            });
          }}
          onConfirmField={confirmField}
          onCorrectField={fieldMarking.startMarkingField}
          onSaveFieldValue={onSaveFieldValue}
          onHighlightField={highlightRegion}
          onSelectField={selectField}
          hideInlineFieldList={Boolean(correctionSheetViewport && selectedFieldKey)}
          hideInlineTableList={tableSheetOpen}
        />
      ) : (
        <aside className="layout-side-panel layout-side-panel-loading">
          <p className="muted">{t('documents.layoutIrLoading')}</p>
        </aside>
      )}
      {correctionSheetViewport ? (
        <DocumentFieldCorrectionSheet
          open={selectedFieldKey != null}
          fieldName={selectedFieldKey ? fieldLabelForKey(selectedFieldKey) : ''}
          value={selectedField?.value ?? ''}
          sourceLabel={
            selectedRegion ? sourceChipPageLabel(selectedRegion.page, i18n.language) : undefined
          }
          onClose={() => {
            setSelectedFieldKey(null);
          }}
          onConfirm={
            selectedField
              ? () => {
                  confirmField(selectedField.key, selectedField.value);
                  setSelectedFieldKey(null);
                }
              : undefined
          }
          onCorrect={fieldMarking.sheetMarkInDocument}
          onSaveValue={fieldMarking.sheetSaveValue}
          onSourceClick={
            selectedFieldKey
              ? () => {
                  highlightRegion(selectedFieldKey);
                }
              : undefined
          }
        />
      ) : null}
      {correctionSheetViewport ? (
        <DocumentTableCorrectionSheet
          open={selectedTableId != null}
          region={tableRegions.find((item) => item.id === selectedTableId) ?? null}
          index={Math.max(
            0,
            tableRegions.findIndex((item) => item.id === selectedTableId)
          )}
          onClose={() => {
            setSelectedTableId(null);
          }}
          onSelect={() => {
            if (selectedTableId) {
              setActiveOverlayId(regionTableOverlayId(selectedTableId));
            }
          }}
          onLayoutApply={
            selectedTableId
              ? (choice) => {
                  applyTableLayoutChoice(selectedTableId, choice);
                }
              : undefined
          }
          onCellChange={
            selectedTableId
              ? (row, col, text) => {
                  submitTableCorrection({
                    id: crypto.randomUUID(),
                    op: 'edit_cell',
                    beforeRegionId: selectedTableId,
                    cell: { row, col, text },
                  });
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
