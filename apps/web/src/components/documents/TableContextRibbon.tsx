// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { TableStructureChoice } from '../../lib/tableLayouts';
import { RibbonGroup } from '../layout/AppRibbon';
import { useAppRibbonContextSlot } from '../layout/appRibbonContext';
import { useTableStructureEditorContext } from './table/TableStructureEditorContext';
import { TableStructureTools } from './table/TableStructureTools';

interface TableContextRibbonProps {
  region: DocumentRegionDto;
  index: number;
  onLayoutApply?: (choice: TableStructureChoice) => void;
  onEditInDocument?: () => void;
  onRedetect?: () => void;
  documentEditOpen?: boolean;
  onSaveDocumentBounds?: () => void;
  onExitDocumentEdit?: () => void;
}

/**
 * Table structure verbs in the app context ribbon row (with overlay save/close while editing on PDF).
 */
export function TableContextRibbon({
  region,
  index,
  onLayoutApply,
  onEditInDocument,
  onRedetect,
  documentEditOpen = false,
  onSaveDocumentBounds,
  onExitDocumentEdit,
}: TableContextRibbonProps) {
  const slot = useAppRibbonContextSlot();
  const { t } = useTranslation();
  const editor = useTableStructureEditorContext();
  if (!slot || !editor || !region.table || onLayoutApply === undefined) {
    return null;
  }

  return createPortal(
    <RibbonGroup label={t('ribbon.tableTools')} kind="act" showCaption>
      <TableStructureTools
        editor={editor}
        index={index}
        placement="ribbon"
        onLayoutApply={onLayoutApply}
        onEditInDocument={onEditInDocument}
        onRedetect={onRedetect}
        documentEditOpen={documentEditOpen}
        onSaveDocumentBounds={onSaveDocumentBounds}
        onExitDocumentEdit={onExitDocumentEdit}
      />
    </RibbonGroup>,
    slot
  );
}