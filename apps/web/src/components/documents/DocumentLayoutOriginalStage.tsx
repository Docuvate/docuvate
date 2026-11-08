// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, LayoutToken, NormalizedRect } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { DocumentFieldContextBar } from './DocumentFieldContextBar';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';
import { DocumentSelectionLayer } from './DocumentSelectionLayer';
import type { DocumentSelectionTool } from './DocumentSelectionTools';
import { FieldBoundingBoxEditor } from './FieldBoundingBoxEditor';
import { type PdfLayoutOverlay, PdfViewer } from './PdfViewer';
import { TablePdfOverlay } from './table/TablePdfOverlay';

interface LayoutBBoxEdit {
  page: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface LayoutFieldOption {
  value: string;
  label: string;
}

interface StageHighlight {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DocumentLayoutOriginalStageProps {
  previewUnavailable: boolean;
  previewLoading: boolean;
  previewData: ArrayBuffer | null;
  highlights: StageHighlight[];
  pdfOverlays: PdfLayoutOverlay[];
  overlayEnabled: boolean;
  activeOverlayId: string | null;
  onOverlaySelect: (overlayId: string) => void;
  onOverlayHover: (overlay: PdfLayoutOverlay | null) => void;
  onOverlayClear: () => void;
  viewerPage: number;
  onViewerPageChange: (page: number) => void;
  onPageClick?: (page: number, x: number, y: number) => void;
  displayRotationDeg: 0 | 90 | 180 | 270;
  pageRotations: Readonly<Partial<Record<number, 0 | 90 | 180 | 270>>>;
  showSelectionLayer: boolean;
  selectionTool: DocumentSelectionTool;
  layoutTokens: LayoutToken[];
  onSelectionDraft: (draft: DocumentSelectionDraft | null) => void;
  bboxEdit: LayoutBBoxEdit | null;
  onBboxCancel: () => void;
  onBboxCommit: (rect: NormalizedRect) => void;
  tableOverlayOpen: boolean;
  tableRegions: readonly DocumentRegionDto[];
  selectedTableId: string | null;
  tableSelectedCell: { row: number; col: number } | null;
  onTableSelectCell: (cell: { row: number; col: number }) => void;
  onTableClose: () => void;
  onTableBoundsCommit: (region: DocumentRegionDto, rect: NormalizedRect) => void;
  selectionDraft: DocumentSelectionDraft | null;
  fieldOptions: LayoutFieldOption[];
  existingFieldValues: ReadonlyMap<string, string>;
  onMarkTable?: () => void;
  onConfirmField: (fieldKey: string) => void;
  onCancelDraft: () => void;
  hoverOverlay: PdfLayoutOverlay | null;
  showHover: boolean;
}

/**
 * Original-document stage: the PDF, selection, field box, table overlay, and the draft bar.
 * Corrections stay in the workspace; this component only places them on the page.
 */
export function DocumentLayoutOriginalStage({
  previewUnavailable,
  previewLoading,
  previewData,
  highlights,
  pdfOverlays,
  overlayEnabled,
  activeOverlayId,
  onOverlaySelect,
  onOverlayHover,
  onOverlayClear,
  viewerPage,
  onViewerPageChange,
  onPageClick,
  displayRotationDeg,
  pageRotations,
  showSelectionLayer,
  selectionTool,
  layoutTokens,
  onSelectionDraft,
  bboxEdit,
  onBboxCancel,
  onBboxCommit,
  tableOverlayOpen,
  tableRegions,
  selectedTableId,
  tableSelectedCell,
  onTableSelectCell,
  onTableClose,
  onTableBoundsCommit,
  selectionDraft,
  fieldOptions,
  existingFieldValues,
  onMarkTable,
  onConfirmField,
  onCancelDraft,
  hoverOverlay,
  showHover,
}: DocumentLayoutOriginalStageProps) {
  const { t } = useTranslation();
  const tableRegion =
    tableOverlayOpen && selectedTableId
      ? tableRegions.find((item) => item.id === selectedTableId)
      : undefined;
  const tableOnPage =
    tableRegion?.table != null && tableRegion.page === viewerPage ? tableRegion : undefined;
  return (
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
          onLayoutOverlaySelect={onOverlaySelect}
          onLayoutOverlayHover={onOverlayHover}
          onLayoutOverlayClear={onOverlayClear}
          page={viewerPage}
          onPageChange={onViewerPageChange}
          paginated
          fitWidth
          onPageClick={onPageClick}
          displayRotationDeg={displayRotationDeg}
          pageRotations={pageRotations}
        />
      )}
      {showSelectionLayer ? (
        <DocumentSelectionLayer
          tool={selectionTool}
          page={viewerPage}
          tokens={layoutTokens}
          onDraftChange={onSelectionDraft}
        />
      ) : null}
      {bboxEdit?.page === viewerPage ? (
        <FieldBoundingBoxEditor
          page={bboxEdit.page}
          rect={bboxEdit}
          active
          pageRotationDeg={displayRotationDeg}
          onCancel={onBboxCancel}
          onCommit={onBboxCommit}
        />
      ) : null}
      {tableOnPage?.table ? (
        <TablePdfOverlay
          region={tableOnPage}
          table={tableOnPage.table}
          active
          pageRotationDeg={displayRotationDeg}
          selectedCell={tableSelectedCell}
          onSelectCell={(row, col) => {
            onTableSelectCell({ row, col });
          }}
          onClose={onTableClose}
          onBoundsCommit={(rect) => {
            onTableBoundsCommit(tableOnPage, rect);
          }}
        />
      ) : null}
      {selectionDraft ? (
        <DocumentFieldContextBar
          draft={selectionDraft}
          fieldOptions={fieldOptions}
          existingFieldValues={existingFieldValues}
          onMarkTable={onMarkTable}
          onConfirm={onConfirmField}
          onCancel={onCancelDraft}
        />
      ) : null}
      {showHover && hoverOverlay ? (
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
  );
}
