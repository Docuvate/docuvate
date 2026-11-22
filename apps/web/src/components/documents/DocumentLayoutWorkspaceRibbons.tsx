// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';

import type { StructuringPrimary } from '../../lib/structuringRibbon';
import type { TableStructureChoice } from '../../lib/tableLayouts';
import { regionTableOverlayId } from '../../lib/workspacePdfOverlays';
import type { LayoutSideTab } from './DocumentLayoutSidePanel';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';
import type { DocumentSelectionTool } from './DocumentSelectionTools';
import { LayoutSidePanelRibbon } from './LayoutSidePanelRibbon';
import { SelectionContextRibbon } from './SelectionContextRibbon';
import { StructuringContextRibbon } from './StructuringContextRibbon';
import { TableContextRibbon } from './TableContextRibbon';

interface DocumentLayoutWorkspaceRibbonsProps {
  structuringPrimary: StructuringPrimary | null | undefined;
  blocksDirty: boolean;
  saving: boolean;
  editMode: boolean;
  onEditModeChange: (next: boolean) => void;
  onSaveBlocks: () => void;
  selectionTool: DocumentSelectionTool;
  onSelectionToolChange: (tool: DocumentSelectionTool) => void;
  hasOverlays: boolean;
  overlayEnabled: boolean;
  onOverlayChange: (enabled: boolean) => void;
  selectionContextActive: boolean;
  tableContextActive: boolean;
  layoutSideTab: LayoutSideTab;
  layoutPanelOpen: boolean;
  selectionDraft: DocumentSelectionDraft | null;
  selectionFieldOptions: { key: string; label: string }[];
  existingFieldValues: Record<string, string>;
  onConfirmSelection: (key: string) => void;
  onMarkTableFromSelection: (() => void) | undefined;
  onCancelSelection: () => void;
  selectedTableRegion: DocumentRegionDto | null;
  selectedTableIndex: number;
  onTableLayoutApply: (choice: TableStructureChoice) => void;
  onEditTableInDocument: () => void;
  onRedetectTable: () => void;
  tableOverlayOpen: boolean;
  onSaveTableBounds: () => void;
  onExitTableDocumentEdit: () => void;
  tableRegions: readonly DocumentRegionDto[];
  setSelectedTableId: (id: string | null) => void;
  setSelectedFieldKey: (key: string | null) => void;
  setActiveOverlayId: (id: string | null) => void;
  setTableOverlayOpen: (open: boolean) => void;
  onLayoutSideTabChange: (tab: LayoutSideTab) => void;
  setLayoutPanelOpen: (open: boolean) => void;
}

/** Context-row portals for layout: Area tools, structure panel, selection, table verbs. */
export function DocumentLayoutWorkspaceRibbons(props: DocumentLayoutWorkspaceRibbonsProps) {
  const {
    structuringPrimary,
    blocksDirty,
    saving,
    editMode,
    onEditModeChange,
    onSaveBlocks,
    selectionTool,
    onSelectionToolChange,
    hasOverlays,
    overlayEnabled,
    onOverlayChange,
    selectionContextActive,
    tableContextActive,
    layoutSideTab,
    layoutPanelOpen,
    selectionDraft,
    selectionFieldOptions,
    existingFieldValues,
    onConfirmSelection,
    onMarkTableFromSelection,
    onCancelSelection,
    selectedTableRegion,
    selectedTableIndex,
    onTableLayoutApply,
    onEditTableInDocument,
    onRedetectTable,
    tableOverlayOpen,
    onSaveTableBounds,
    onExitTableDocumentEdit,
    tableRegions,
    setSelectedTableId,
    setSelectedFieldKey,
    setActiveOverlayId,
    setTableOverlayOpen,
    onLayoutSideTabChange,
    setLayoutPanelOpen,
  } = props;

  const layoutSelectionDraft = selectionContextActive ? selectionDraft : null;

  return (
    <>
      <StructuringContextRibbon
        primary={structuringPrimary ?? null}
        textDirty={blocksDirty}
        saving={saving}
        editMode={editMode}
        onEditModeChange={onEditModeChange}
        onSaveText={onSaveBlocks}
        selectionTool={selectionTool}
        onSelectionToolChange={onSelectionToolChange}
        hasOverlays={hasOverlays}
        overlayEnabled={overlayEnabled}
        onOverlayChange={onOverlayChange}
        paused={selectionContextActive || tableContextActive}
      />
      {structuringPrimary === 'layout' ? (
        <LayoutSidePanelRibbon
          activeTab={layoutSideTab}
          open={layoutPanelOpen}
          onOpenTab={(tab) => {
            setLayoutPanelOpen(true);
            onLayoutSideTabChange(tab);
            if (tab === 'tables' && tableRegions.length > 0) {
              const first = tableRegions[0];
              setSelectedTableId(first.id);
              setSelectedFieldKey(null);
              setActiveOverlayId(regionTableOverlayId(first.id));
              return;
            }
            setSelectedTableId(null);
            setTableOverlayOpen(false);
          }}
          onClose={() => {
            setLayoutPanelOpen(false);
            setSelectedTableId(null);
            setTableOverlayOpen(false);
          }}
        />
      ) : null}
      {layoutSelectionDraft ? (
        <SelectionContextRibbon
          draft={layoutSelectionDraft}
          fieldOptions={selectionFieldOptions}
          existingFieldValues={existingFieldValues}
          onConfirm={onConfirmSelection}
          onMarkTable={onMarkTableFromSelection}
          onCancel={onCancelSelection}
        />
      ) : null}
      {tableContextActive && selectedTableRegion ? (
        <TableContextRibbon
          region={selectedTableRegion}
          index={selectedTableIndex}
          hasOverlays={hasOverlays}
          overlayEnabled={overlayEnabled}
          onOverlayChange={onOverlayChange}
          onLayoutApply={onTableLayoutApply}
          onEditInDocument={onEditTableInDocument}
          onRedetect={onRedetectTable}
          documentEditOpen={tableOverlayOpen}
          onSaveDocumentBounds={onSaveTableBounds}
          onExitDocumentEdit={onExitTableDocumentEdit}
        />
      ) : null}
    </>
  );
}
