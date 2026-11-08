// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { ribbonActionClass } from '../../lib/ribbonAction';
import {
  contextToolsFor,
  type StructuringPrimary,
} from '../../lib/structuringRibbon';
import { RibbonGroup } from '../layout/AppRibbon';
import { useAppRibbonContextSlot } from '../layout/appRibbonContext';
import { Button } from '../ui/Button';
import { type DocumentSelectionTool, DocumentSelectionTools } from './DocumentSelectionTools';

interface StructuringContextRibbonProps {
  primary: StructuringPrimary | null;
  textDirty: boolean;
  saving: boolean;
  editMode: boolean;
  onEditModeChange: (next: boolean) => void;
  onSaveText: () => void;
  selectionTool: DocumentSelectionTool;
  onSelectionToolChange: (tool: DocumentSelectionTool) => void;
  hasOverlays: boolean;
  overlayEnabled: boolean;
  onOverlayChange: (enabled: boolean) => void;
}

/**
 * Third ribbon row. Rendered only for Text and Layout. Save and the region
 * overlay stay visible when they cannot run, with the reason on the control.
 */
export function StructuringContextRibbon({
  primary,
  textDirty,
  saving,
  editMode,
  onEditModeChange,
  onSaveText,
  selectionTool,
  onSelectionToolChange,
  hasOverlays,
  overlayEnabled,
  onOverlayChange,
}: StructuringContextRibbonProps) {
  const slot = useAppRibbonContextSlot();
  const { t } = useTranslation();
  const tools = contextToolsFor(primary, { textDirty, hasOverlays });
  if (!slot || tools.length === 0 || primary === null) return null;
  const textTools = primary === 'text';
  const label = textTools ? t('ribbon.toolsText') : t('ribbon.toolsLayout');
  const hint = textTools
    ? t('documents.layoutTextEditHint')
    : t(`documents.selectionToolHint.${selectionTool}`);

  return createPortal(
    <RibbonGroup label={label}>
      <div className="structuring-context" data-testid="structuring-context" data-primary={primary}>
        {textTools ? (
          <>
            <Button
              type="button"
              size="sm"
              variant={editMode ? 'secondary' : 'ghost'}
              className={ribbonActionClass(editMode ? 'secondary' : 'tertiary')}
              aria-pressed={editMode}
              data-testid="structuring-edit-text"
              onClick={() => {
                onEditModeChange(!editMode);
              }}
            >
              {t('documents.ribbonEditText')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={ribbonActionClass('secondary')}
              disabled={!textDirty || saving}
              title={textDirty ? undefined : t('documents.ribbonSaveTextUnavailable')}
              data-testid="structuring-save-text"
              onClick={onSaveText}
            >
              {saving ? t('documents.saving') : t('documents.ribbonSaveText')}
            </Button>
          </>
        ) : (
          <>
            <DocumentSelectionTools value={selectionTool} onChange={onSelectionToolChange} />
            <Button
              type="button"
              size="sm"
              variant={overlayEnabled ? 'secondary' : 'ghost'}
              className={ribbonActionClass(overlayEnabled ? 'secondary' : 'tertiary')}
              aria-pressed={hasOverlays ? overlayEnabled : undefined}
              disabled={!hasOverlays}
              title={hasOverlays ? t('documents.layoutOverlayToggle') : t('documents.ribbonOverlayUnavailable')}
              data-testid="structuring-overlay"
              onClick={() => {
                onOverlayChange(!overlayEnabled);
              }}
            >
              {t('documents.layoutOverlayToggle')}
            </Button>
          </>
        )}
        <p className="structuring-context-hint">{hint}</p>
      </div>
    </RibbonGroup>,
    slot
  );
}
