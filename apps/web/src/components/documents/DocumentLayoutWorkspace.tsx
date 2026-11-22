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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { hitTestLayoutOverlay, overlayForExtractionBlock } from '../../lib/layoutOverlayModel';
import {
  firstPageBelowSsimFloor,
  reconstructionQualityTone,
} from '../../lib/layoutReconstructionQuality';
import { useFeatureFlags } from '../../lib/remoteConfig';
import { sourceChipPageLabel } from '../../lib/sourceChipLabel';
import type { StructuringPrimary } from '../../lib/structuringRibbon';
import type { TableStructureChoice } from '../../lib/tableLayouts';
import { useDocumentLayoutIr } from '../../lib/useDocumentLayoutIr';
import { useDocumentPageTransforms } from '../../lib/useDocumentPageTransforms';
import { useDocumentRegionLayers } from '../../lib/useDocumentRegionLayers';
import { useLayoutCompare } from '../../lib/useLayoutCompare';
import { useViewportMaxWidth } from '../../lib/useViewportMaxWidth';
import {
  buildWorkspaceLayoutOverlays,
  buildWorkspacePdfOverlays,
  regionFieldOverlayId,
  regionIdFromFieldOverlay,
  regionIdFromTableOverlay,
  regionTableOverlayId,
} from '../../lib/workspacePdfOverlays';
import { useToast } from '../save';
import { Card } from '../ui/Card';
import { DocumentExtractionRecovery } from './DocumentExtractionRecovery';
import { DocumentFieldMarkHint, useDocumentFieldMarking } from './DocumentFieldMarkHint';
import {
  type AdvancedViewerMode,
  DocumentLayoutAdvancedPanel,
} from './DocumentLayoutAdvancedPanel';
import { DocumentLayoutCompareView } from './DocumentLayoutCompareView';
import { DocumentLayoutCorrectionSheets } from './DocumentLayoutCorrectionSheets';
import { DocumentLayoutOriginalStage } from './DocumentLayoutOriginalStage';
import { DocumentLayoutPaneTabs, useLayoutMobilePane } from './DocumentLayoutPaneTabs';
import {
  DocumentLayoutSidePanel,
  type LayoutSideTab,
  overlayRegionById,
} from './DocumentLayoutSidePanel';
import { DocumentLayoutTextStage } from './DocumentLayoutTextStage';
import { DocumentLayoutViewerToolbar, type LeftDocumentMode } from './DocumentLayoutViewerToolbar';
import { DocumentLayoutWorkspaceRibbons } from './DocumentLayoutWorkspaceRibbons';
import { type DocumentSelectionDraft } from './DocumentSelectionLayer';
import type { DocumentSelectionTool } from './DocumentSelectionTools';
import { ExtractedLayoutHtmlFrame, type LayoutIrZoomStep } from './ExtractedLayoutHtmlFrame';
import { type PdfLayoutOverlay } from './PdfViewer';
import { TableStructureEditorProvider } from './table/TableStructureEditorContext';
import { useDocumentLayoutPositionEdit } from './useDocumentLayoutPositionEdit';
import { useDocumentLayoutWorkspaceKeyboard } from './useDocumentLayoutWorkspaceKeyboard';

const CORRECTION_SHEET_MAX_WIDTH_PX = 1023;

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
  onRejectFieldSuggestion?: (key: string, value: string) => void;
  rejectedSuggestionIdentities?: ReadonlySet<string>;
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
  /** Primary structuring mode. Text shows the text stage; layout shows region tools. */
  structuringPrimary?: StructuringPrimary | null;
  onStructuringPrimaryChange?: (primary: StructuringPrimary) => void;
  /** When set, open the field bounding-box editor for this key. */
  positionEditFieldKey?: string | null;
  onPositionEditHandled?: () => void;
  /** Value correction belongs in the Strukturieren workbench — redirect from Layout Felder. */
  onRequestFieldValueEdit?: (fieldKey: string) => void;
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
  onRejectFieldSuggestion,
  rejectedSuggestionIdentities,
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
  structuringPrimary = null,
  onStructuringPrimaryChange,
  positionEditFieldKey = null,
  onPositionEditHandled,
  onRequestFieldValueEdit,
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
  const { rotationForPage, rotatePageClockwise, byPage } = useDocumentPageTransforms(doc.id);
  const displayRotationDeg = rotationForPage(viewerPage);
  const rotateClockwise = useCallback(() => {
    void rotatePageClockwise(viewerPage).then(() => {
      // toast is optional; keep UI snappy
    });
  }, [rotatePageClockwise, viewerPage]);
  const [bboxEditRect, setBboxEditRect] = useState<{
    page: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [tableOverlayOpen, setTableOverlayOpen] = useState(false);
  const [tableOverlayCell, setTableOverlayCell] = useState<{ row: number; col: number } | null>(
    null
  );
  const tableOverlaySaveRef = useRef<(() => void) | null>(null);

  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [hoverOverlay, setHoverOverlay] = useState<PdfLayoutOverlay | null>(null);
  const [layoutZoom, setLayoutZoom] = useState<LayoutIrZoomStep>(100);
  const dismissedSuggestions = useMemo(
    () => new Set(rejectedSuggestionIdentities ?? []),
    [rejectedSuggestionIdentities]
  );
  const [selectionTool, setSelectionTool] = useState<DocumentSelectionTool>('none');
  const [selectionDraft, setSelectionDraft] = useState<DocumentSelectionDraft | null>(null);
  const [reanchorFieldKey, setReanchorFieldKey] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);

  /** Changes whenever the stored layout IR can have changed (reprocess finished, status flip). */
  const layoutIrRevision = `${doc.status}:${doc.updatedAt}:${String(layoutIrAvailable)}`;
  const { layoutTokens, fieldRegions, tableRegions, refreshRegions } = useDocumentRegionLayers(
    doc.id,
    viewerPage,
    layoutIrRevision
  );
  useDocumentLayoutPositionEdit(
    positionEditFieldKey,
    fieldRegions,
    onViewerPageChange,
    onPositionEditHandled,
    setReanchorFieldKey,
    setSelectionTool,
    setSelectedFieldKey,
    setBboxEditRect
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
        // Cell grid lives in the side panel (wide) / sheet (narrow); open it with the table.
        setLayoutPanelOpen(true);
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
    if (textEditOpen === (leftMode === 'text')) return;
    setLeftMode(textEditOpen ? 'text' : 'original');
    if (textEditOpen) setAdvancedOpen(false);
  }, [leftMode, textEditOpen]);

  const markTableFromSelection = useCallback(() => {
    if (reanchorFieldKey || !selectionDraft) {
      return;
    }
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
  }, [reanchorFieldKey, selectionDraft, submitTableCorrection]);

  const confirmFieldFromSelection = useCallback(
    (fieldKey: string) => {
      if (!selectionDraft) {
        return;
      }
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
          ...(selectionDraft.text.trim().length > 0 ? { valueOverride: selectionDraft.text } : {}),
        },
        t('documents.fieldCorrectionSaved', { name: fieldLabelForKey(fieldKey) })
      ).catch((err: unknown) => {
        toast.error(formatUserFacingError(err, 'errors.generic'));
      });
    },
    [
      fieldLabelForKey,
      reanchorFieldKey,
      runFieldCorrection,
      selectionDraft,
      t,
      toast,
    ]
  );

  const selectionFieldOptions = useMemo(
    () =>
      reanchorFieldKey
        ? [{ value: reanchorFieldKey, label: fieldLabelForKey(reanchorFieldKey) }]
        : fieldOptions,
    [fieldLabelForKey, fieldOptions, reanchorFieldKey]
  );

  const selectionMarkTableEnabled = !reanchorFieldKey && selectionDraft != null;

  useEffect(() => {
    if (structuringPrimary === 'layout') {
      setSelectionTool('rect');
      setOverlayEnabled(true);
      // Area tools own the page; structure panel stays closed until ribbon opens it.
      setSelectedTableId(null);
      setTableOverlayOpen(false);
      setActiveOverlayId(null);
      setLayoutPanelOpen(false);
      return;
    }
    // Leaving Layout drops an unfinished spatial draft so ribbon/bottom assign UI cannot diverge.
    setSelectionDraft(null);
    setReanchorFieldKey(null);
    if (structuringPrimary === 'fields') {
      setSelectedTableId(null);
      setTableOverlayOpen(false);
      setActiveOverlayId(null);
      onLayoutSideTabChange('fields');
      setLayoutPanelOpen(true);
      return;
    }
    if (structuringPrimary === 'labels' || structuringPrimary === 'text') {
      setSelectedTableId(null);
      setTableOverlayOpen(false);
      setLayoutPanelOpen(false);
    }
  }, [structuringPrimary, onLayoutSideTabChange]);

  const setLeftDocumentMode = useCallback(
    (mode: LeftDocumentMode) => {
      setLeftMode(mode);
      if (mode === 'text') setAdvancedOpen(false);
      onTextEditOpenChange(mode === 'text');
    },
    [onTextEditOpenChange]
  );

  const frameLayoutIr =
    layoutIr ?? (layoutIrPages?.length ? layoutIrDocumentFromPageSummaries(layoutIrPages) : null);

  const overlays = useMemo(
    () => buildWorkspaceLayoutOverlays(layoutIr, tableRegions),
    [layoutIr, tableRegions]
  );
  const overlayLabels = useMemo(
    () => ({
      correctedTable: (ordinal: string) => t('documents.layoutCorrectedTableLabel', { n: ordinal }),
      detectedTable: (index: number) => t('documents.layoutTableLabel', { n: index }),
      field: fieldLabelForKey,
      unnamedField: t('documents.layoutOverlayKind.field'),
    }),
    [fieldLabelForKey, t]
  );
  const pdfOverlays = useMemo(
    () => buildWorkspacePdfOverlays(overlays, fieldRegions, overlayLabels),
    [fieldRegions, overlayLabels, overlays]
  );

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
        setSelectedFieldKey(null);
        if (structuringPrimary === 'fields') {
          // Werte prüfen: fields panel stays primary; table geometry waits for Layout.
          setSelectedTableId(null);
          setTableOverlayOpen(false);
          onLayoutSideTabChange('fields');
        } else {
          setSelectedTableId(tableId);
          setTableOverlayOpen(true);
          setOverlayEnabled(true);
          setLayoutPanelOpen(true);
          onLayoutSideTabChange('tables');
        }
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
      structuringPrimary,
      onActiveBlockIndexChange,
      onHighlightBlocks,
      onLayoutSideTabChange,
      onViewerPageChange,
      overlays,
    ]
  );

  useDocumentLayoutWorkspaceKeyboard({
    structuringPrimary,
    pdfOverlayCount: pdfOverlays.length,
    selectionDraft,
    reanchorFieldKey,
    selectionMarkTableEnabled,
    onStructuringPrimaryChange,
    setActiveOverlayId,
    setSelectionDraft,
    setSelectionTool,
    setReanchorFieldKey,
    setOverlayEnabled,
    markTableFromSelection,
    onReanchorEnter: () => {
      if (!selectionDraft || !reanchorFieldKey) return;
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
          ...(selectionDraft.text.trim().length > 0 ? { valueOverride: selectionDraft.text } : {}),
        },
        t('documents.fieldCorrectionSaved', { name: fieldLabelForKey(reanchorFieldKey) })
      ).catch((err: unknown) => {
        toast.error(formatUserFacingError(err, 'errors.generic'));
      });
    },
  });

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
  const selectedTableRegion = selectedTableId
    ? (tableRegions.find((item) => item.id === selectedTableId) ?? null)
    : null;
  const selectedTableIndex = Math.max(
    0,
    tableRegions.findIndex((item) => item.id === selectedTableId)
  );
  const tableStructureRibbonActive = structuringPrimary === 'layout' && selectedTableRegion != null;
  const selectionContextActive = structuringPrimary === 'layout' && selectionDraft != null;
  const tableContextActive = tableStructureRibbonActive && !selectionContextActive;

  return (
    <TableStructureEditorProvider region={selectedTableRegion} active={tableStructureRibbonActive}>
    <div
      className={
        correctionSheetOpen
          ? 'layout-workspace layout-workspace--correction-sheet'
          : 'layout-workspace'
      }
      data-correction-sheet-viewport={correctionSheetViewport ? '1' : '0'}
      data-structuring-primary={structuringPrimary ?? ''}
      data-selected-field={selectedFieldKey ?? ''}
      data-selected-table={selectedTableId ?? ''}
      data-layout-panel={layoutPanelOpen ? '1' : '0'}
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

          <DocumentLayoutWorkspaceRibbons
            structuringPrimary={structuringPrimary}
            blocksDirty={blocksDirty}
            saving={saving}
            editMode={editMode}
            onEditModeChange={onEditModeChange}
            onSaveBlocks={onSaveBlocks}
            selectionTool={selectionTool}
            onSelectionToolChange={setSelectionTool}
            hasOverlays={pdfOverlays.length > 0}
            overlayEnabled={overlayEnabled}
            onOverlayChange={setOverlayEnabled}
            selectionContextActive={selectionContextActive}
            tableContextActive={tableContextActive}
            layoutSideTab={layoutSideTab}
            layoutPanelOpen={layoutPanelOpen}
            selectionDraft={selectionDraft}
            selectionFieldOptions={selectionFieldOptions}
            existingFieldValues={existingFieldValues}
            onConfirmSelection={confirmFieldFromSelection}
            onMarkTableFromSelection={
              selectionMarkTableEnabled ? markTableFromSelection : undefined
            }
            onCancelSelection={() => {
              setSelectionDraft(null);
              setReanchorFieldKey(null);
            }}
            selectedTableRegion={selectedTableRegion}
            selectedTableIndex={selectedTableIndex}
            onTableLayoutApply={(choice) => {
              if (!selectedTableRegion) return;
              applyTableLayoutChoice(selectedTableRegion.id, choice);
            }}
            onEditTableInDocument={() => {
              if (!selectedTableRegion) return;
              setTableOverlayOpen(true);
              onViewerPageChange(selectedTableRegion.page);
            }}
            onRedetectTable={() => {
              if (!selectedTableRegion) return;
              submitTableCorrection(
                {
                  id: crypto.randomUUID(),
                  op: 'create',
                  beforeRegionId: selectedTableRegion.id,
                  page: selectedTableRegion.page,
                  shape: 'rect',
                  x0: selectedTableRegion.x0,
                  y0: selectedTableRegion.y0,
                  x1: selectedTableRegion.x1,
                  y1: selectedTableRegion.y1,
                  blockIndexes: selectedTableRegion.blockIndexes,
                },
                t('tableLayouts.redetectGrid')
              );
            }}
            tableOverlayOpen={tableOverlayOpen}
            onSaveTableBounds={() => {
              tableOverlaySaveRef.current?.();
            }}
            onExitTableDocumentEdit={() => {
              setTableOverlayOpen(false);
            }}
            tableRegions={tableRegions}
            setSelectedTableId={setSelectedTableId}
            setSelectedFieldKey={setSelectedFieldKey}
            setActiveOverlayId={setActiveOverlayId}
            setTableOverlayOpen={setTableOverlayOpen}
            onLayoutSideTabChange={onLayoutSideTabChange}
            setLayoutPanelOpen={setLayoutPanelOpen}
          />
          <DocumentLayoutViewerToolbar
            leftMode={leftMode}
            onLeftModeChange={setLeftDocumentMode}
            zoom={layoutZoom}
            onZoomChange={setLayoutZoom}
            showTechnicalDetails={showTechnicalDetails}
            qualityTone={qualityTone}
            qualityPage={qualityReviewPage ?? viewerPage}
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
            data-selection-tool={structuringPrimary === 'layout' ? selectionTool : 'none'}
            data-table-overlay={tableOverlayOpen ? '1' : '0'}
            data-field-bbox={bboxEditRect ? '1' : '0'}
            ref={fieldMarking.viewerStageRef}
          >
            {leftMode === 'text' ? (
              <DocumentLayoutTextStage
                documentId={doc.id}
                fullText={doc.extraction?.text ?? ''}
                layoutIrAvailable={layoutIrAvailable}
                layoutIrDocument={layoutIr}
                layoutIrPages={layoutIrPages}
                blocks={blocks}
                viewerPage={viewerPage}
                activeBlockIndex={activeBlockIndex}
                editMode={editMode}
                onViewerPageChange={onViewerPageChange}
                onHighlightBlocks={onHighlightBlocks}
                onBlocksChange={onBlocksChange}
                onActiveBlockIndexChange={onActiveBlockIndexChange}
                documentTitle={doc.title || doc.filename}
                blocksDirty={blocksDirty}
                saving={saving}
                onSaveBlocks={onSaveBlocks}
              />
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
              <DocumentLayoutOriginalStage
                previewUnavailable={previewUnavailable}
                previewLoading={previewLoading}
                previewData={previewData}
                highlights={highlights}
                pdfOverlays={pdfOverlays}
                overlayEnabled={overlayEnabled}
                activeOverlayId={activeOverlayId}
                onOverlaySelect={(id) => {
                  onOverlaySelect(id);
                }}
                onOverlayHover={setHoverOverlay}
                onOverlayClear={() => {
                  setActiveOverlayId(null);
                }}
                zoomPercent={layoutZoom}
                viewerPage={viewerPage}
                onViewerPageChange={onViewerPageChange}
                onPageClick={selectionTool === 'none' ? onPdfPageClick : undefined}
                displayRotationDeg={displayRotationDeg}
                pageRotations={byPage}
                showSelectionLayer={!showAdvancedStage}
                selectionTool={structuringPrimary === 'layout' ? selectionTool : 'none'}
                layoutTokens={layoutTokens}
                onSelectionDraft={setSelectionDraft}
                bboxEdit={bboxEditRect}
                onBboxCancel={() => {
                  setBboxEditRect(null);
                }}
                onBboxCommit={(rect) => {
                  const fieldKey = selectedFieldKey ?? reanchorFieldKey;
                  if (!fieldKey || !bboxEditRect) {
                    setBboxEditRect(null);
                    return;
                  }
                  void runFieldCorrection(
                    {
                      id: crypto.randomUUID(),
                      op: 'reanchor',
                      fieldKey,
                      page: bboxEditRect.page,
                      shape: 'rect',
                      x0: rect.x0,
                      y0: rect.y0,
                      x1: rect.x1,
                      y1: rect.y1,
                    },
                    t('documents.fieldCorrectionSaved', { name: fieldLabelForKey(fieldKey) })
                  )
                    .then(() => {
                      setBboxEditRect(null);
                    })
                    .catch((err: unknown) => {
                      toast.error(formatUserFacingError(err, 'errors.generic'));
                    });
                }}
                tableOverlayOpen={tableOverlayOpen}
                tableRegions={tableRegions}
                selectedTableId={selectedTableId}
                tableSelectedCell={tableOverlayCell}
                onTableSelectCell={setTableOverlayCell}
                onTableClose={() => {
                  setTableOverlayOpen(false);
                }}
                onTableBoundsCommit={(region, rect) => {
                  // Re-create from the drawn frame so row/col rules are inferred again.
                  submitTableCorrection(
                    {
                      id: crypto.randomUUID(),
                      op: 'create',
                      beforeRegionId: region.id,
                      page: region.page,
                      shape: 'rect',
                      x0: rect.x0,
                      y0: rect.y0,
                      x1: rect.x1,
                      y1: rect.y1,
                      blockIndexes: region.blockIndexes,
                    },
                    t('tableLayouts.saveBounds')
                  );
                }}
                onTableRulesCommit={(region, commit) => {
                  submitTableCorrection(
                    {
                      id: crypto.randomUUID(),
                      op: 'set_headers',
                      beforeRegionId: region.id,
                      rules: commit.rules,
                      ...(commit.cells ? { cells: commit.cells } : {}),
                      ...(commit.merges ? { merges: commit.merges } : {}),
                      ...(commit.rowRoles ? { rowRoles: commit.rowRoles } : {}),
                    },
                    t('tableLayouts.guidesSaved')
                  );
                }}
                onTableRedetect={
                  selectedTableId
                    ? () => {
                        const region = tableRegions.find((item) => item.id === selectedTableId);
                        if (!region) return;
                        submitTableCorrection(
                          {
                            id: crypto.randomUUID(),
                            op: 'create',
                            beforeRegionId: region.id,
                            page: region.page,
                            shape: 'rect',
                            x0: region.x0,
                            y0: region.y0,
                            x1: region.x1,
                            y1: region.y1,
                            blockIndexes: region.blockIndexes,
                          },
                          t('tableLayouts.redetectGrid')
                        );
                      }
                    : undefined
                }
                tableChromeInRibbon={tableOverlayOpen}
                onTableChromeReady={(chrome) => {
                  tableOverlaySaveRef.current = chrome?.saveBounds ?? null;
                }}
                selectionDraft={selectionDraft}
                fieldOptions={selectionFieldOptions}
                existingFieldValues={existingFieldValues}
                onMarkTable={selectionMarkTableEnabled ? markTableFromSelection : undefined}
                onConfirmField={confirmFieldFromSelection}
                onCancelDraft={() => {
                  setSelectionDraft(null);
                  setReanchorFieldKey(null);
                }}
                hoverOverlay={hoverOverlay}
                showHover={Boolean(hoverOverlay && overlayEnabled)}
              />
            )}
          </div>

          {layoutAdvancedEnabled ? (
            <DocumentLayoutAdvancedPanel
              advancedOpen={advancedOpen}
              onAdvancedOpenChange={setAdvancedOpen}
              advancedView={advancedView}
              onAdvancedViewChange={setAdvancedView}
              onRevealOriginalMode={() => {
                setLeftDocumentMode('original');
              }}
              documentId={doc.id}
              documentTitle={doc.title || doc.filename}
              hasLayoutIr={Boolean(layoutIr?.pages.length)}
              blocks={blocks}
            />
          ) : null}
        </Card>
      </div>

      {layoutPanelOpen && frameLayoutIr ? (
        <DocumentLayoutSidePanel
          layoutIr={frameLayoutIr}
          fields={fields}
          knownFieldKeys={knownFieldKeys}
          fieldLabelForKey={fieldLabelForKey}
          activeTab={layoutSideTab}
          hideTablist
          preferRibbonTools
          onTabChange={(tab) => {
            onLayoutSideTabChange(tab);
            setLayoutPanelOpen(true);
            if (tab === 'tables' && tableRegions.length > 0 && !selectedTableId) {
              const first = tableRegions[0];
              setSelectedTableId(first.id);
              setSelectedFieldKey(null);
              setActiveOverlayId(regionTableOverlayId(first.id));
            }
            if (tab !== 'tables') {
              setSelectedTableId(null);
              setTableOverlayOpen(false);
            }
          }}
          activeOverlayId={activeOverlayId}
          selectedTableId={selectedTableId}
          onOverlaySelect={onOverlaySelect}
          onAcceptSuggestion={(key, value) => {
            onAcceptFieldSuggestion(key, value);
          }}
          onDismissSuggestion={(key, value) => {
            onRejectFieldSuggestion?.(key, value);
          }}
          dismissedSuggestions={dismissedSuggestions}
          heuristicSuggestions={heuristicSuggestions}
          recognizedCatalog={recognizedCatalog}
          fieldRegions={fieldRegions}
          tableRegions={tableRegions}
          onTableEditInDocument={(regionId) => {
            setSelectedTableId(regionId);
            setTableOverlayOpen(true);
            setOverlayEnabled(true);
            const region = tableRegions.find((item) => item.id === regionId);
            if (region) onViewerPageChange(region.page);
          }}
          onTableRedetect={(regionId) => {
            const region = tableRegions.find((item) => item.id === regionId);
            if (!region) return;
            setSelectedTableId(regionId);
            setTableOverlayOpen(true);
            onViewerPageChange(region.page);
            submitTableCorrection(
              {
                id: crypto.randomUUID(),
                op: 'create',
                beforeRegionId: region.id,
                page: region.page,
                shape: 'rect',
                x0: region.x0,
                y0: region.y0,
                x1: region.x1,
                y1: region.y1,
                blockIndexes: region.blockIndexes,
              },
              t('tableLayouts.redetectGrid')
            );
          }}
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
          onCorrectField={onRequestFieldValueEdit ?? fieldMarking.startMarkingField}
          onSaveFieldValue={onSaveFieldValue}
          onHighlightField={highlightRegion}
          onSelectField={selectField}
          hideInlineFieldList={Boolean(correctionSheetViewport && selectedFieldKey)}
          hideInlineTableList={tableSheetOpen}
        />
      ) : layoutPanelOpen ? (
        <aside className="layout-side-panel layout-side-panel-loading">
          <p className="muted">{t('documents.layoutIrLoading')}</p>
        </aside>
      ) : null}
      <DocumentLayoutCorrectionSheets
        enabled={correctionSheetViewport}
        selectedFieldKey={selectedFieldKey}
        selectedField={selectedField}
        fieldName={selectedFieldKey ? fieldLabelForKey(selectedFieldKey) : ''}
        sourceLabel={
          selectedRegion ? sourceChipPageLabel(selectedRegion.page, i18n.language) : undefined
        }
        onCloseField={() => {
          setSelectedFieldKey(null);
        }}
        onConfirmField={
          selectedField
            ? () => {
                confirmField(selectedField.key, selectedField.value);
                setSelectedFieldKey(null);
              }
            : undefined
        }
        onCorrectField={fieldMarking.sheetMarkInDocument}
        onSaveFieldValue={fieldMarking.sheetSaveValue}
        onSourceClick={
          selectedFieldKey
            ? () => {
                highlightRegion(selectedFieldKey);
              }
            : undefined
        }
        selectedTableId={selectedTableId}
        tableRegions={tableRegions}
        onCloseTable={() => {
          setSelectedTableId(null);
        }}
        onSelectTableOverlay={setActiveOverlayId}
        onTableLayoutApply={
          selectedTableId
            ? (choice) => {
                applyTableLayoutChoice(selectedTableId, choice);
              }
            : undefined
        }
        onTableCellChange={
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
    </div>
    </TableStructureEditorProvider>
  );
}
