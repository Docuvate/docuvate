// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, ExtractedField } from '@docuvate/contracts';

import type { TableStructureChoice } from '../../lib/tableLayouts';
import { regionTableOverlayId } from '../../lib/workspacePdfOverlays';
import { DocumentFieldCorrectionSheet } from './DocumentFieldCorrectionSheet';
import { DocumentTableCorrectionSheet } from './DocumentTableCorrectionSheet';

interface DocumentLayoutCorrectionSheetsProps {
  enabled: boolean;
  selectedFieldKey: string | null;
  selectedField: ExtractedField | null | undefined;
  fieldName: string;
  sourceLabel: string | undefined;
  onCloseField: () => void;
  onConfirmField: (() => void) | undefined;
  onCorrectField?: () => void;
  onSaveFieldValue?: (value: string) => void;
  onSourceClick: (() => void) | undefined;
  selectedTableId: string | null;
  tableRegions: readonly DocumentRegionDto[];
  onCloseTable: () => void;
  onSelectTableOverlay: (overlayId: string) => void;
  onTableLayoutApply: ((choice: TableStructureChoice) => void) | undefined;
  onTableCellChange: ((row: number, col: number, text: string) => void) | undefined;
}

/** Narrow-viewport field/table correction sheets for the layout workspace. */
export function DocumentLayoutCorrectionSheets({
  enabled,
  selectedFieldKey,
  selectedField,
  fieldName,
  sourceLabel,
  onCloseField,
  onConfirmField,
  onCorrectField,
  onSaveFieldValue,
  onSourceClick,
  selectedTableId,
  tableRegions,
  onCloseTable,
  onSelectTableOverlay,
  onTableLayoutApply,
  onTableCellChange,
}: DocumentLayoutCorrectionSheetsProps) {
  if (!enabled) return null;
  return (
    <>
      <DocumentFieldCorrectionSheet
        open={selectedFieldKey != null}
        fieldName={fieldName}
        value={selectedField?.value ?? ''}
        sourceLabel={sourceLabel}
        onClose={onCloseField}
        onConfirm={onConfirmField}
        onCorrect={onCorrectField}
        onSaveValue={onSaveFieldValue}
        onSourceClick={onSourceClick}
      />
      <DocumentTableCorrectionSheet
        open={selectedTableId != null}
        region={tableRegions.find((item) => item.id === selectedTableId) ?? null}
        index={Math.max(
          0,
          tableRegions.findIndex((item) => item.id === selectedTableId)
        )}
        onClose={onCloseTable}
        onSelect={() => {
          if (selectedTableId) {
            onSelectTableOverlay(regionTableOverlayId(selectedTableId));
          }
        }}
        onLayoutApply={onTableLayoutApply}
        onCellChange={onTableCellChange}
      />
    </>
  );
}
