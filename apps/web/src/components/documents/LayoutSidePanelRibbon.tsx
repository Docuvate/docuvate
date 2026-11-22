// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { ribbonActionClass } from '../../lib/ribbonAction';
import { RibbonGroup } from '../layout/AppRibbon';
import { useAppRibbonContextSlot } from '../layout/appRibbonContext';
import { Button } from '../ui/Button';
import type { LayoutSideTab } from './DocumentLayoutSidePanel';

const TABS: readonly LayoutSideTab[] = ['fields', 'tables', 'outline'];

interface LayoutSidePanelRibbonProps {
  activeTab: LayoutSideTab | null;
  open: boolean;
  onOpenTab: (tab: LayoutSideTab) => void;
  onClose: () => void;
  /** Hide while selection/table tools own the context row. */
  paused?: boolean;
}

/**
 * Übersicht / Tabellen / Gliederung live in the ribbon — the bottom panel opens only on demand.
 */
export function LayoutSidePanelRibbon({
  activeTab,
  open,
  onOpenTab,
  onClose,
  paused = false,
}: LayoutSidePanelRibbonProps) {
  const slot = useAppRibbonContextSlot();
  const { t } = useTranslation();
  if (!slot || paused) return null;

  const labelFor = (tab: LayoutSideTab): string => {
    switch (tab) {
      case 'fields':
        return t('documents.layoutTabOverview');
      case 'tables':
        return t('documents.layoutTabTables');
      case 'outline':
        return t('documents.layoutTabOutline');
      default: {
        const never: never = tab;
        return never;
      }
    }
  };

  return createPortal(
    <RibbonGroup label={t('ribbon.layoutPanel')} kind="navigate" showCaption>
      <div className="layout-side-panel-ribbon" data-testid="layout-side-panel-ribbon" role="toolbar">
        {TABS.map((tab) => {
          const selected = open && activeTab === tab;
          return (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={selected ? 'secondary' : 'ghost'}
              className={ribbonActionClass(selected ? 'secondary' : 'tertiary')}
              aria-pressed={selected}
              data-testid={`layout-panel-tab-${tab}`}
              onClick={() => {
                if (selected) {
                  onClose();
                  return;
                }
                onOpenTab(tab);
              }}
            >
              {labelFor(tab)}
            </Button>
          );
        })}
      </div>
    </RibbonGroup>,
    slot
  );
}
