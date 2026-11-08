// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, ChevronDown, Eye, FileText, Layers, RotateCw, ScanText } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { reconstructionQualityTone } from '../../lib/layoutReconstructionQuality';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { IconButton } from '../ui/IconButton';
import { MenuItem } from '../ui/MenuItem';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';
import { SegmentedControl } from '../ui/SegmentedControl';
import { LAYOUT_IR_ZOOM_STEPS, type LayoutIrZoomStep } from './ExtractedLayoutHtmlFrame';

export type LeftDocumentMode = 'original' | 'text';

interface DocumentLayoutViewerToolbarProps {
  leftMode: LeftDocumentMode;
  onLeftModeChange: (mode: LeftDocumentMode) => void;
  showAdvancedStage: boolean;
  zoom: LayoutIrZoomStep;
  onZoomChange: (zoom: LayoutIrZoomStep) => void;
  showTechnicalDetails: boolean;
  qualityTone: ReturnType<typeof reconstructionQualityTone>;
  qualityPage: number;
  /** Recognised regions drawn over the page; undefined when there is nothing to show. */
  overlay?: { enabled: boolean; onChange: (enabled: boolean) => void };
  /** Turn the page view; undefined where the view cannot rotate. */
  onRotate?: () => void;
}

/**
 * Page chrome that stays with the document: zoom, rotation, and the original/text menu.
 * Pointer, text selection, and region tools live on the layout row of the ribbon.
 */
export function DocumentLayoutViewerToolbar({
  leftMode,
  onLeftModeChange,
  showAdvancedStage,
  zoom,
  onZoomChange,
  showTechnicalDetails,
  qualityTone,
  qualityPage,
  overlay,
  onRotate,
}: DocumentLayoutViewerToolbarProps) {
  const { t } = useTranslation();
  const zoomOptions = useMemo(
    () => LAYOUT_IR_ZOOM_STEPS.map((step) => ({ value: String(step), label: `${String(step)}%` })),
    []
  );
  const viewLabel =
    leftMode === 'text' ? t('documents.layoutViewText') : t('documents.layoutViewOriginal');

  return (
    <div className="layout-viewer-toolbar" data-testid="layout-viewer-toolbar">
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
        {onRotate ? (
          <IconButton
            icon={RotateCw}
            size="sm"
            data-testid="pdf-viewer-rotate-clockwise"
            label={t('documents.pdfRotateClockwise')}
            onClick={onRotate}
          />
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
                data-testid="layout-view-rotate-clockwise"
                onClick={onRotate}
              />
            ) : null}
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}
