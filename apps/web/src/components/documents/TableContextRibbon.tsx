// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { ribbonActionClass } from '../../lib/ribbonAction';
import type { TableStructureChoice } from '../../lib/tableLayouts';
import { RibbonGroup } from '../layout/AppRibbon';
import { useAppRibbonContextSlot } from '../layout/appRibbonContext';
import { Button } from '../ui/Button';
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
  hasOverlays?: boolean;
  overlayEnabled?: boolean;
  onOverlayChange?: (enabled: boolean) => void;
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
  hasOverlays = false,
  overlayEnabled = false,
  onOverlayChange,
}: TableContextRibbonProps) {
  const slot = useAppRibbonContextSlot();
  const { t } = useTranslation();
  const editor = useTableStructureEditorContext();
  if (!slot || !editor || !region.table || onLayoutApply === undefined) {
    return null;
  }

  return createPortal(
    <RibbonGroup label={t('ribbon.tableTools')} kind="act" showCaption>
      <div className="table-context-ribbon">
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
      {onOverlayChange ? (
        <Button
          type="button"
          size="sm"
          variant={overlayEnabled ? 'secondary' : 'ghost'}
          className={ribbonActionClass(overlayEnabled ? 'secondary' : 'tertiary')}
          aria-pressed={hasOverlays ? overlayEnabled : undefined}
          disabled={!hasOverlays}
          title={
            hasOverlays ? t('documents.layoutOverlayToggle') : t('documents.ribbonOverlayUnavailable')
          }
          data-testid="structuring-overlay"
          onClick={() => {
            onOverlayChange(!overlayEnabled);
          }}
        >
          {t('documents.layoutOverlayToggle')}
        </Button>
      ) : null}
      </div>
    </RibbonGroup>,
    slot
  );
}