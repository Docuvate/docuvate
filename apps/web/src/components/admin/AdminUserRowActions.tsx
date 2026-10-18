// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AdminUserDto } from '@docuvate/contracts';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconButton } from '../ui/IconButton';

export type AdminUserMenuAction =
  | { kind: 'ban'; user: AdminUserDto }
  | { kind: 'unban'; user: AdminUserDto }
  | { kind: 'revoke'; user: AdminUserDto }
  | { kind: 'resend-invite'; user: AdminUserDto }
  | { kind: 'revoke-invite'; user: AdminUserDto };

interface Props {
  user: AdminUserDto;
  busy: boolean;
  disabled: boolean;
  onSelect: (action: AdminUserMenuAction) => void;
}

interface RowActionPair {
  primary: { label: string; action: AdminUserMenuAction } | null;
  danger: { label: string; action: AdminUserMenuAction } | null;
}

function actionsForUser(user: AdminUserDto, t: (key: string) => string): RowActionPair {
  if (user.accountStatus === 'invited') {
    return {
      primary: {
        label: t('admin.usersResendInvite'),
        action: { kind: 'resend-invite', user },
      },
      danger: {
        label: t('admin.usersRevokeInvite'),
        action: { kind: 'revoke-invite', user },
      },
    };
  }
  if (user.accountStatus === 'suspended') {
    return {
      primary: {
        label: t('admin.usersUnban'),
        action: { kind: 'unban', user },
      },
      danger: null,
    };
  }
  return {
    primary: {
      label: t('admin.usersRevokeSessions'),
      action: { kind: 'revoke', user },
    },
    danger: {
      label: t('admin.usersBan'),
      action: { kind: 'ban', user },
    },
  };
}

export function AdminUserRowActions({ user, busy, disabled, onSelect }: Props) {
  const { t } = useTranslation();
  const { primary, danger } = actionsForUser(user, t);

  if (!primary && !danger) {
    return null;
  }

  const actionDisabled = disabled || busy;

  return (
    <>
      {primary ? (
        <IconButton
          icon={Pencil}
          label={primary.label}
          size="sm"
          disabled={actionDisabled}
          onClick={() => {
            onSelect(primary.action);
          }}
        />
      ) : null}
      {danger ? (
        <IconButton
          icon={Trash2}
          label={danger.label}
          size="sm"
          className="admin-users-action-danger"
          disabled={actionDisabled}
          onClick={() => {
            onSelect(danger.action);
          }}
        />
      ) : null}
    </>
  );
}
