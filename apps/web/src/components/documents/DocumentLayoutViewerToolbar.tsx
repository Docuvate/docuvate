// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, ChevronDown, Eye, FileText, Layers, RotateCw, ScanText } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { reconstructionQualityTone } from '../../lib/layoutReconstructionQuality';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { Button } from '../ui/Button';
import { MenuItem } from '../ui/MenuItem';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';
import { SegmentedControl } from '../ui/SegmentedControl';
import { type DocumentSelectionTool, DocumentSelectionTools } from './DocumentSelectionTools';
import { LAYOUT_IR_ZOOM_STEPS, type LayoutIrZoomStep } from './ExtractedLayoutHtmlFrame';

export type LeftDocumentMode = 'original' | 'text';

interface DocumentLayoutViewerToolbarProps {
  leftMode: LeftDocumentMode;
  onLeftModeChange: (mode: LeftDocumentMode) => void;
  showAdvancedStage: boolean;
  selectionTool: DocumentSelectionTool;
  onSelectionToolChange: (tool: DocumentSelectionTool) => void;
  zoom: LayoutIrZoomStep;
  onZoomChange: (zoom: LayoutIrZoomStep) => void;
  showTechnicalDetails: boolean;
  qualityTone: ReturnType<typeof reconstructionQualityTone>;
  qualityPage: number;
  editMode: boolean;
  onEditModeChange: (next: boolean) => void;
  /** Recognised regions drawn over the page; undefined when there is nothing to show. */
  overlay?: { enabled: boolean; onChange: (enabled: boolean) => void };
  /** Turn the page view; undefined where the view cannot rotate. */
  onRotate?: () => void;
}

/**
 * One bar above the page. The structuring task leads: how a click on the page behaves (pick,
 * mark text, drag an area) with a one-line hint. How the page is shown (original or recognised
 * text, regions, rotation) is a single "Ansicht" menu at the end, not a second mode bar.
 */
export function DocumentLayoutViewerToolbar({
  leftMode,
  onLeftModeChange,
  showAdvancedStage,
  selectionTool,
  onSelectionToolChange,
  zoom,
  onZoomChange,
  showTechnicalDetails,
  qualityTone,
  qualityPage,
  editMode,
  onEditModeChange,
  overlay,
  onRotate,
}: DocumentLayoutViewerToolbarProps) {
  const { t } = useTranslation();
  const zoomOptions = useMemo(
    () => LAYOUT_IR_ZOOM_STEPS.map((step) => ({ value: String(step), label: `${String(step)}%` })),
    []
  );
  const marking = leftMode === 'original' && !showAdvancedStage;
  const viewLabel =
    leftMode === 'text' ? t('documents.layoutViewText') : t('documents.layoutViewOriginal');

  return (
    <div className="layout-viewer-toolbar" data-testid="layout-viewer-toolbar">
      {marking ? (
        <>
          <DocumentSelectionTools value={selectionTool} onChange={onSelectionToolChange} />
          <p className="layout-viewer-toolbar-hint" aria-live="polite">
            {t(`documents.selectionToolHint.${selectionTool}`)}
          </p>
        </>
      ) : null}
      {showAdvancedStage || leftMode === 'text' ? (
        <SegmentedControl
          ariaLabel={t('documents.layoutZoomAria')}
          className={segmentedToolbarClass('layout-zoom-switch', 'segmented-control--zoom')}
          value={String(zoom)}
          options={zoomOptions}
          onChange={(value) => {
            const next = LAYOUT_IR_ZOOM_STEPS.find((step) => String(step) === value);
            if (next !== undefined) {
              onZoomChange(next);
            }
          }}
        />
      ) : null}
      {showTechnicalDetails && qualityTone !== 'unknown' ? (
        <span
          className={`layout-quality-badge layout-quality-badge-technical layout-quality-badge-${qualityTone}`}
          title={t('documents.layoutQualityTooltip')}
        >
          {qualityTone === 'good'
            ? t('documents.layoutQualityGood')
            : t('documents.layoutQualityReviewPlain', { page: qualityPage })}
        </span>
      ) : null}
      <div className="layout-viewer-toolbar-actions">
        {leftMode === 'text' ? (
          <Button
            type="button"
            size="sm"
            variant={editMode ? 'secondary' : 'ghost'}
            aria-pressed={editMode}
            onClick={() => {
              onEditModeChange(!editMode);
            }}
          >
            {editMode ? t('documents.layoutTextEditDone') : t('documents.layoutTextEdit')}
          </Button>
        ) : null}
        <Menu>
          <MenuTrigger
            className={ribbonActionClass('tertiary', {
              menu: true,
              className: 'layout-view-menu-trigger',
            })}
            aria-label={t('documents.layoutViewMenuAria', { view: viewLabel })}
            title={t('documents.layoutViewMenuAria', { view: viewLabel })}
          >
            <Eye size={16} strokeWidth={1.75} aria-hidden />
            <span>{viewLabel}</span>
            <ChevronDown size={14} strokeWidth={2} aria-hidden />
          </MenuTrigger>
          <MenuContent className="popover-surface layout-view-menu" align="end">
            <MenuItem
              role="menuitemradio"
              aria-checked={leftMode === 'original'}
              icon={FileText}
              label={t('documents.layoutViewOriginal')}
              variant={leftMode === 'original' ? 'active' : 'default'}
              onClick={() => {
                onLeftModeChange('original');
              }}
            />
            <MenuItem
              role="menuitemradio"
              aria-checked={leftMode === 'text'}
              icon={ScanText}
              label={t('documents.layoutViewText')}
              variant={leftMode === 'text' ? 'active' : 'default'}
              onClick={() => {
                onLeftModeChange('text');
              }}
            />
            {overlay || onRotate ? <hr className="document-detail-overflow-divider" /> : null}
            {overlay ? (
              <MenuItem
                role="menuitemcheckbox"
                aria-checked={overlay.enabled}
                icon={overlay.enabled ? Check : Layers}
                label={t('documents.layoutOverlayToggle')}
                onClick={() => {
                  overlay.onChange(!overlay.enabled);
                }}
              />
            ) : null}
            {onRotate ? (
              <MenuItem
                role="menuitem"
                icon={RotateCw}
                label={t('documents.pdfRotateClockwise')}
                onClick={onRotate}
              />
            ) : null}
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}
