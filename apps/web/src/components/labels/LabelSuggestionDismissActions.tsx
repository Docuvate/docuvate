// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';

export type LabelSuggestionDismissScope = 'local' | 'global';

interface Props {
  labelName: string;
  disabled?: boolean;
  onDismiss: (scope: LabelSuggestionDismissScope) => void | Promise<void>;
}

export function LabelSuggestionDismissActions({ labelName, disabled, onDismiss }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  const runDismiss = useCallback(
    async (scope: LabelSuggestionDismissScope) => {
      setBusy(true);
      try {
        await onDismiss(scope);
      } finally {
        setBusy(false);
        setConfirmOpen(false);
        setMenuOpen(false);
      }
    },
    [onDismiss]
  );

  const openMenu = () => {
    const el = menuAnchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setMenuOpen(true);
  };

  const blocked = disabled ?? busy;

  return (
    <>
      <IconButton
        ref={menuAnchorRef}
        icon={MoreHorizontal}
        label={t('labels.todoDismissMenuAria', { name: labelName })}
        hasPopup="menu"
        expanded={menuOpen}
        disabled={blocked}
        className="labels-overflow-btn"
        onClick={openMenu}
      />
      <ContextMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        anchorRef={menuAnchorRef}
        onClose={() => { setMenuOpen(false); }}
        items={[
          {
            kind: 'item',
            id: 'dismiss-local',
            label: t('labelSuggestions.dismissRecommendation'),
            description: t('labelSuggestions.dismissRecommendationDesc'),
            disabled: blocked,
            onSelect: () => void runDismiss('local'),
          },
          {
            kind: 'item',
            id: 'block-global',
            label: t('labelSuggestions.blockGlobal'),
            description: t('labelSuggestions.blockGlobalDesc'),
            danger: true,
            disabled: blocked,
            onSelect: () => { setConfirmOpen(true); },
          },
        ]}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={t('labelSuggestions.blockGlobalConfirmTitle', { name: labelName })}
        description={
          <Trans
            i18nKey="labelSuggestions.blockGlobalConfirmDesc"
            components={{
              settingsLink: (
                <Link to={routes.settingsBlockedLabels} className="confirm-dialog-inline-link" />
              ),
            }}
          />
        }
        confirmLabel={t('labelSuggestions.blockGlobal')}
        tone="danger"
        busy={busy}
        onCancel={() => { setConfirmOpen(false); }}
        onConfirm={() => void runDismiss('global')}
      />
    </>
  );
}
