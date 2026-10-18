// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MoreHorizontal } from 'lucide-react';
import { type ReactNode,useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContextMenu, type ContextMenuEntry } from '../../components/ui/ContextMenu';
import { IconButton } from '../../components/ui/IconButton';

export interface DateisystemContentSecondaryAction {
  id: string;
  menuLabel: string;
  onMenuSelect: () => void;
  node: ReactNode;
  /** Keep visible when overflow menu would hide secondary actions (e.g. open inline form). */
  forceVisible?: boolean;
}

interface DateisystemContentActionsProps {
  primary: ReactNode;
  secondary: DateisystemContentSecondaryAction[];
}

export function DateisystemContentActions({ primary, secondary }: DateisystemContentActionsProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const overflowBtnRef = useRef<HTMLButtonElement>(null);

  const menuItems: ContextMenuEntry[] = secondary.map((entry) => ({
    kind: 'item',
    id: entry.id,
    label: entry.menuLabel,
    onSelect: () => {
      entry.onMenuSelect();
      setMenuOpen(false);
    },
  }));

  return (
    <div className="dateisystem-content-actions">
      <div className="dateisystem-content-actions-row">
        <div className="dateisystem-content-action dateisystem-content-action--primary">
          {primary}
        </div>
        {secondary.map((entry) => (
          <div
            key={entry.id}
            className={[
              'dateisystem-content-action',
              'dateisystem-content-action--secondary',
              entry.forceVisible ? 'dateisystem-content-action--force-visible' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {entry.node}
          </div>
        ))}
        {secondary.length > 0 ? (
          <div className="dateisystem-content-action dateisystem-content-action--overflow">
            <IconButton
              ref={overflowBtnRef}
              icon={MoreHorizontal}
              label={t('filesystem.headerMoreActions')}
              hasPopup="menu"
              expanded={menuOpen}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setMenuPos({ x: rect.left, y: rect.bottom });
                setMenuOpen((open) => !open);
              }}
            />
          </div>
        ) : null}
      </div>
      <ContextMenu
        open={menuOpen && menuItems.length > 0}
        x={menuPos.x}
        y={menuPos.y}
        items={menuItems}
        anchorRef={overflowBtnRef}
        onClose={() => { setMenuOpen(false); }}
      />
    </div>
  );
}
