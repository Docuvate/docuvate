// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { reconstructionQualityTone } from '../../lib/layoutReconstructionQuality';
import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { Button } from '../ui/Button';
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
}

/** Viewer mode, selection tool and zoom controls; wraps into full-width rows on narrow screens. */
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
}: DocumentLayoutViewerToolbarProps) {
  const { t } = useTranslation();
  const leftModeOptions = useMemo(
    () => [
      { value: 'original' as const, label: t('documents.layoutViewOriginal') },
      { value: 'text' as const, label: t('documents.layoutViewText') },
    ],
    [t]
  );
  const zoomOptions = useMemo(
    () => LAYOUT_IR_ZOOM_STEPS.map((step) => ({ value: String(step), label: `${String(step)}%` })),
    []
  );

  return (
    <div className="layout-viewer-toolbar" data-testid="layout-viewer-toolbar">
      <SegmentedControl<LeftDocumentMode>
        ariaLabel={t('documents.layoutViewModeAria')}
        className={segmentedToolbarClass('layout-view-mode-switch', 'segmented-control--text-wide')}
        value={leftMode}
        options={leftModeOptions}
        onChange={onLeftModeChange}
      />
      {leftMode === 'original' && !showAdvancedStage ? (
        <DocumentSelectionTools value={selectionTool} onChange={onSelectionToolChange} />
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
      {leftMode === 'text' ? (
        <div className="layout-viewer-toolbar-actions">
          <Button
            type="button"
            variant={editMode ? 'secondary' : 'ghost'}
            aria-pressed={editMode}
            onClick={() => {
              onEditModeChange(!editMode);
            }}
          >
            {editMode ? t('documents.layoutTextEditDone') : t('documents.layoutTextEdit')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
