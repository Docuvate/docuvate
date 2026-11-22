// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DocumentLayoutExportTab } from './DocumentLayoutExportTab';

export type AdvancedViewerMode = 'reconstruction' | 'compare';

interface DocumentLayoutAdvancedPanelProps {
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
  advancedView: AdvancedViewerMode;
  onAdvancedViewChange: (mode: AdvancedViewerMode) => void;
  onRevealOriginalMode: () => void;
  documentId: string;
  documentTitle: string;
  hasLayoutIr: boolean;
  blocks: ExtractionBlock[];
}

export function DocumentLayoutAdvancedPanel({
  advancedOpen,
  onAdvancedOpenChange,
  advancedView,
  onAdvancedViewChange,
  onRevealOriginalMode,
  documentId,
  documentTitle,
  hasLayoutIr,
  blocks,
}: DocumentLayoutAdvancedPanelProps) {
  const { t } = useTranslation();

  const advancedViewOptions = useMemo(
    () => [
      { value: 'reconstruction' as const, label: t('documents.layoutViewReconstruction') },
      { value: 'compare' as const, label: t('documents.layoutViewCompare') },
    ],
    [t]
  );

  return (
    <details
      className="layout-advanced-panel"
      open={advancedOpen}
      onToggle={(event) => {
        const open = event.currentTarget.open;
        onAdvancedOpenChange(open);
        if (open) {
          onRevealOriginalMode();
        }
      }}
    >
      <summary className="layout-advanced-summary">{t('documents.layoutAdvancedSummary')}</summary>
      <div className="layout-advanced-body">
        <SegmentedControl<AdvancedViewerMode>
          ariaLabel={t('documents.layoutAdvancedViewAria')}
          className={segmentedToolbarClass(
            'layout-advanced-view-switch',
            'segmented-control--text-wide'
          )}
          value={advancedView}
          options={advancedViewOptions}
          onChange={onAdvancedViewChange}
        />
        <div className="layout-advanced-export">
          <DocumentLayoutExportTab
            documentId={documentId}
            documentTitle={documentTitle}
            hasLayoutIr={hasLayoutIr}
            blocks={blocks}
          />
        </div>
      </div>
    </details>
  );
}