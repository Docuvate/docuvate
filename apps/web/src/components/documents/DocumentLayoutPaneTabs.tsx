// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { segmentedToolbarClass } from '../../lib/segmentedControlClasses';
import { useViewportMaxWidth } from '../../lib/useViewportMaxWidth';
import { SegmentedControl } from '../ui/SegmentedControl';

type LayoutMobilePane = 'document' | 'panel';

/** Below this width the viewer and the side panel share the screen as tabs. */
const LAYOUT_PANE_TABS_MAX_WIDTH_PX = 767;

interface LayoutMobilePaneState {
  /** True when the viewport is narrow enough to show only one pane at a time. */
  narrow: boolean;
  pane: LayoutMobilePane;
  setPane: (pane: LayoutMobilePane) => void;
  showDocument: () => void;
}

/**
 * Which pane is visible on small screens. While a correction sheet is open the document shows behind it,
 * so the marked region stays visible; closing the sheet returns to the pane the user had chosen.
 */
export function useLayoutMobilePane(correctionSheetOpen: boolean): LayoutMobilePaneState {
  const narrow = useViewportMaxWidth(LAYOUT_PANE_TABS_MAX_WIDTH_PX);
  const [chosenPane, setPane] = useState<LayoutMobilePane>('document');
  const showDocument = useCallback(() => {
    setPane('document');
  }, []);
  const pane = correctionSheetOpen ? 'document' : chosenPane;
  return { narrow, pane, setPane, showDocument };
}

interface DocumentLayoutPaneTabsProps {
  pane: LayoutMobilePane;
  onPaneChange: (pane: LayoutMobilePane) => void;
}

/** "Dokument" / "Felder" switch shown on small screens instead of stacking both panes. */
export function DocumentLayoutPaneTabs({ pane, onPaneChange }: DocumentLayoutPaneTabsProps) {
  const { t } = useTranslation();
  const options = useMemo(
    () => [
      { value: 'document' as const, label: t('documents.layoutPaneDocument') },
      { value: 'panel' as const, label: t('documents.layoutPanePanel') },
    ],
    [t]
  );
  return (
    <SegmentedControl<LayoutMobilePane>
      ariaLabel={t('documents.layoutPaneAria')}
      className={segmentedToolbarClass('layout-pane-tabs', 'segmented-control--text-wide')}
      value={pane}
      options={options}
      onChange={onPaneChange}
    />
  );
}
