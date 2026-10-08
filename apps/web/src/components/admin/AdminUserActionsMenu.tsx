import { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { AdminUserDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';

export type AdminUserMenuAction =
  | { kind: 'ban'; user: AdminUserDto }
  | { kind: 'unban'; user: AdminUserDto }
  | { kind: 'revoke'; user: AdminUserDto }
  | { kind: 'resend-invite'; user: AdminUserDto }
  | { kind: 'revoke-invite'; user: AdminUserDto };

type Props = {
  user: AdminUserDto;
  busy: boolean;
  disabled: boolean;
  onSelect: (action: AdminUserMenuAction) => void;
};

export function AdminUserActionsMenu({ user, busy, disabled, onSelect }: Props) {
  const { t } = useTranslation();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState({ x: 0, y: 0 });

  const items: ContextMenuEntry[] = [];
  if (user.accountStatus === 'invited') {
    items.push({
      kind: 'item',
      id: 'revoke-invite',
      label: t('admin.usersRevokeInvite'),
      danger: true,
      onSelect: () => onSelect({ kind: 'revoke-invite', user }),
    });
  } else if (user.accountStatus === 'suspended') {
    items.push({
      kind: 'item',
      id: 'unban',
      label: t('admin.usersUnban'),
      onSelect: () => onSelect({ kind: 'unban', user }),
    });
  } else if (user.accountStatus === 'active') {
    items.push(
      {
        kind: 'item',
        id: 'ban',
        label: t('admin.usersBan'),
        danger: true,
        onSelect: () => onSelect({ kind: 'ban', user }),
      },
      {
        kind: 'item',
        id: 'revoke',
        label: t('admin.usersRevokeSessions'),
        onSelect: () => onSelect({ kind: 'revoke', user }),
      }
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        ref={anchorRef}
        icon={MoreHorizontal}
        label={t('admin.usersMoreActions')}
        className="admin-users-overflow-btn"
        disabled={disabled || busy}
        onClick={(event) => {
          setPoint({ x: event.clientX, y: event.clientY });
          setOpen(true);
        }}
      />
      <ContextMenu
        open={open}
        x={point.x}
        y={point.y}
        anchorRef={anchorRef}
        items={items}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
