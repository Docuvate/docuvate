// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AdminUserDto } from '@docuvate/contracts';
import { CircleCheck, CircleDashed, CircleOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminUserStatusBadge({ user }: { user: AdminUserDto }) {
  const { t } = useTranslation();
  if (user.accountStatus === 'invited') {
    return (
      <span className="admin-status-badge admin-status-badge--invited">
        <CircleDashed size={14} aria-hidden />
        {t('admin.usersStatusInvited')}
      </span>
    );
  }
  if (user.accountStatus === 'suspended') {
    return (
      <span className="admin-status-badge admin-status-badge--suspended">
        <CircleOff size={14} aria-hidden />
        {t('admin.usersStatusBanned')}
      </span>
    );
  }
  return (
    <span className="admin-status-badge admin-status-badge--active">
      <CircleCheck size={14} aria-hidden />
      {t('admin.usersStatusActive')}
    </span>
  );
}
