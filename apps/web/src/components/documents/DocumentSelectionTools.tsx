// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { SegmentedControl } from '../ui/SegmentedControl';

export type DocumentSelectionTool = 'none' | 'text' | 'rect';

interface DocumentSelectionToolsProps {
  value: DocumentSelectionTool;
  onChange: (tool: DocumentSelectionTool) => void;
}

export function DocumentSelectionTools({ value, onChange }: DocumentSelectionToolsProps) {
  const { t } = useTranslation();
  return (
    <div data-testid="document-selection-tools">
      <SegmentedControl<DocumentSelectionTool>
        ariaLabel={t('documents.selectionToolsAria')}
        className={segmentedToolbarClass('document-selection-tools', 'segmented-control--text-wide')}
        value={value}
        options={[
          { value: 'none', label: t('documents.selectionToolNone') },
          { value: 'text', label: t('documents.selectionToolText') },
          { value: 'rect', label: t('documents.selectionToolRect') },
        ]}
        onChange={onChange}
      />
    </div>
  );
}
