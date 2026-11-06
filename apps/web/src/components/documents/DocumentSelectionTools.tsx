// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type LucideIcon, MousePointer2, SquareDashed, TextSelect } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { SegmentedControl } from '../ui/SegmentedControl';

export type DocumentSelectionTool = 'none' | 'text' | 'rect';

const TOOLS: readonly {
  value: DocumentSelectionTool;
  icon: LucideIcon;
  labelKey: string;
  shortcut?: string;
}[] = [
  { value: 'none', icon: MousePointer2, labelKey: 'documents.selectionToolNone' },
  { value: 'text', icon: TextSelect, labelKey: 'documents.selectionToolText', shortcut: 'T' },
  { value: 'rect', icon: SquareDashed, labelKey: 'documents.selectionToolRect', shortcut: 'R' },
];

interface DocumentSelectionToolsProps {
  value: DocumentSelectionTool;
  onChange: (tool: DocumentSelectionTool) => void;
}

/**
 * How a click on the page behaves: look and pick found values, mark text, or drag an area. One
 * compact cluster; what to do with a selection is asked right at the selection, not up here.
 */
export function DocumentSelectionTools({ value, onChange }: DocumentSelectionToolsProps) {
  const { t } = useTranslation();
  return (
    <div className="document-selection-tools-wrap" data-testid="document-selection-tools">
      <SegmentedControl<DocumentSelectionTool>
        ariaLabel={t('documents.selectionToolsAria')}
        className={segmentedToolbarClass('document-selection-tools')}
        value={value}
        options={TOOLS.map((tool) => {
          const Icon = tool.icon;
          const label = t(tool.labelKey);
          const hint = tool.shortcut ? `${label} (${tool.shortcut})` : label;
          return {
            value: tool.value,
            label: (
              <span className="segmented-option-content" title={hint}>
                <Icon size={15} strokeWidth={1.75} aria-hidden />
                <span>{label}</span>
                {tool.shortcut ? (
                  <kbd className="document-selection-tool-key">{tool.shortcut}</kbd>
                ) : null}
              </span>
            ),
          };
        })}
        onChange={onChange}
      />
    </div>
  );
}
