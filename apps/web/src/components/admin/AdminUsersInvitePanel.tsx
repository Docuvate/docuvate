// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

type Props = {
  busy: boolean;
  inviteEmail: string;
  inviteName: string;
  inviteRole: InstanceRole;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onRoleChange: (role: InstanceRole) => void;
  onSubmit: () => void;
};

export function AdminUsersInvitePanel({
  busy,
  inviteEmail,
  inviteName,
  inviteRole,
  onEmailChange,
  onNameChange,
  onRoleChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  return (
    <section className="settings-section-card admin-invite-panel">
      <h3 className="settings-subheading">{t('admin.usersInviteTitle')}</h3>
      <p className="muted admin-invite-lead">{t('admin.usersInviteLead')}</p>
      <div className="admin-invite-form">
        <label>
          {t('auth.email')}
          <Input
            value={inviteEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          {t('auth.name')}
          <Input
            value={inviteName}
            onChange={(e) => onNameChange(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          {t('admin.usersRoleLabel')}
          <Select
            value={inviteRole}
            disabled={busy}
            onChange={(value) => onRoleChange(value as InstanceRole)}
            options={[
              { value: 'member', label: t('admin.roles.member') },
              { value: 'admin', label: t('admin.roles.admin') },
            ]}
            aria-label={t('admin.usersRoleLabel')}
          />
        </label>
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
