// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { parseInstanceRole } from '../../lib/instanceRole';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface Props {
  busy: boolean;
  inviteEmail: string;
  inviteRole: InstanceRole;
  onEmailChange: (value: string) => void;
  onRoleChange: (role: InstanceRole) => void;
  onSubmit: () => void;
}

export function AdminUsersInvitePanel({
  busy,
  inviteEmail,
  inviteRole,
  onEmailChange,
  onRoleChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  return (
    <section className="settings-section-card admin-invite-panel">
      <h3 className="settings-subheading">{t('admin.usersInviteTitle')}</h3>
      <p className="muted admin-invite-lead">{t('admin.usersInviteLead')}</p>
      <div className="admin-invite-form admin-invite-form--spec">
        <label className="admin-invite-email-field">
          <span className="visually-hidden">{t('auth.email')}</span>
          <Input
            value={inviteEmail}
            onChange={(e) => { onEmailChange(e.target.value); }}
            placeholder={t('admin.usersInviteEmailPlaceholder')}
            autoComplete="off"
          />
        </label>
        <Select
          value={inviteRole}
          disabled={busy}
          onChange={(value) => { onRoleChange(parseInstanceRole(value)); }}
          options={[
            { value: 'member', label: t('admin.roles.member') },
            { value: 'admin', label: t('admin.roles.admin') },
          ]}
          aria-label={t('admin.usersRoleLabel')}
          className="admin-invite-role-select"
        />
        <Button
          type="button"
          className="admin-invite-submit"
          disabled={busy || !inviteEmail.trim()}
          onClick={onSubmit}
        >
          {busy ? t('admin.usersInvitePending') : t('admin.usersInviteSubmit')}
        </Button>
      </div>
    </section>
  );
}
