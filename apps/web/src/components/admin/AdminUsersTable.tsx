// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AdminUserDto, InstanceRole } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { AdminUserStatusBadge } from './AdminUserStatusBadge';
import { AdminUserActionsMenu, type AdminUserMenuAction } from './AdminUserActionsMenu';
import { getUserRowState, type UserRowState } from './admin-user-row-state';

type Props = {
  users: AdminUserDto[];
  busy: boolean;
  currentUserId: string | null;
  /** When set, this user is the only active administrator (last-admin guard in UI). */
  soleAdministratorUserId: string | null;
  onRoleChange: (user: AdminUserDto, role: InstanceRole) => void;
  onMenuAction: (action: AdminUserMenuAction) => void;
  onPrimaryAction: (action: AdminUserMenuAction) => void;
};

function AdminUserPersonCell({
  user,
  self,
  t,
}: {
  user: AdminUserDto;
  self: boolean;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="admin-users-person-name">
        <span>{user.name}</span>
        {self ? <span className="admin-users-self-badge">{t('admin.usersSelfTag')}</span> : null}
      </div>
      <span className="admin-users-person-email">{user.email}</span>
    </>
  );
}

function AdminUserRoleCell({
  user,
  state,
  t,
  onRoleChange,
}: {
  user: AdminUserDto;
  state: UserRowState;
  t: (key: string) => string;
  onRoleChange: (user: AdminUserDto, role: InstanceRole) => void;
}) {
  const { self, soleAdmin, roleDisabled, readonlyHint } = state;
  if (self || soleAdmin) {
    return (
      <div className="admin-users-role-readonly-wrap">
        <span className="admin-users-role-readonly">
          {user.role === 'admin' ? t('admin.roles.admin') : t('admin.roles.member')}
        </span>
        {readonlyHint ? (
          <span className="admin-users-inline-hint muted" title={readonlyHint}>
            {readonlyHint}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <Select
      value={user.role}
      disabled={roleDisabled}
      onChange={(value) => onRoleChange(user, value as InstanceRole)}
      options={[
        { value: 'member', label: t('admin.roles.member') },
        { value: 'admin', label: t('admin.roles.admin') },
      ]}
      aria-label={t('admin.usersRoleLabel')}
    />
  );
}

function AdminUserActionsCell({
  user,
  state,
  busy,
  t,
  onMenuAction,
  onPrimaryAction,
}: {
  user: AdminUserDto;
  state: UserRowState;
  busy: boolean;
  t: (key: string) => string;
  onMenuAction: (action: AdminUserMenuAction) => void;
  onPrimaryAction: (action: AdminUserMenuAction) => void;
}) {
  const { self, actionsDisabled } = state;
  if (self) {
    return null;
  }
  return (
    <div className="admin-users-actions-cell">
      {user.accountStatus === 'invited' ? (
        <Button
          type="button"
          variant="secondary"
          disabled={actionsDisabled}
          onClick={() => onPrimaryAction({ kind: 'resend-invite', user })}
        >
          {t('admin.usersResendInvite')}
        </Button>
      ) : null}
      <AdminUserActionsMenu
        user={user}
        busy={busy}
        disabled={actionsDisabled}
        onSelect={(action) => {
          onMenuAction(action);
        }}
      />
    </div>
  );
}

export function AdminUsersTable({
  users,
  busy,
  currentUserId,
  soleAdministratorUserId,
  onRoleChange,
  onMenuAction,
  onPrimaryAction,
}: Props) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return <p className="muted admin-users-empty">{t('admin.usersEmpty')}</p>;
  }

  return (
    <div className="admin-users-table-wrap">
      <table className="admin-users-table admin-users-table--wide">
        <thead>
          <tr>
            <th className="admin-users-col-person">{t('admin.usersPersonColumn')}</th>
            <th className="admin-users-col-role">{t('admin.usersRoleLabel')}</th>
            <th>{t('admin.usersStatusLabel')}</th>
            <th className="admin-users-col-actions">{t('admin.usersActionsLabel')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const state = getUserRowState(user, busy, currentUserId, soleAdministratorUserId, t);
            return (
              <tr key={user.id} className={state.self ? 'admin-users-row--self' : undefined}>
                <td className="admin-users-col-person">
                  <AdminUserPersonCell user={user} self={state.self} t={t} />
                </td>
                <td className="admin-users-col-role">
                  <AdminUserRoleCell user={user} state={state} t={t} onRoleChange={onRoleChange} />
                </td>
                <td>
                  <AdminUserStatusBadge user={user} />
                </td>
                <td className="admin-users-col-actions">
                  <AdminUserActionsCell
                    user={user}
                    state={state}
                    busy={busy}
                    t={t}
                    onMenuAction={onMenuAction}
                    onPrimaryAction={onPrimaryAction}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="admin-users-card-list" aria-label={t('admin.usersPersonColumn')}>
        {users.map((user) => {
          const state = getUserRowState(user, busy, currentUserId, soleAdministratorUserId, t);
          return (
            <li
              key={user.id}
              className={`admin-users-card${state.self ? ' admin-users-card--self' : ''}`}
            >
              <div className="admin-users-card-person">
                <AdminUserPersonCell user={user} self={state.self} t={t} />
              </div>
              <div className="admin-users-card-field">
                <span className="admin-users-card-label">{t('admin.usersRoleLabel')}</span>
                <AdminUserRoleCell user={user} state={state} t={t} onRoleChange={onRoleChange} />
              </div>
              <div className="admin-users-card-field">
                <span className="admin-users-card-label">{t('admin.usersStatusLabel')}</span>
                <AdminUserStatusBadge user={user} />
              </div>
              {!state.self ? (
                <div className="admin-users-card-field admin-users-card-actions">
                  <span className="admin-users-card-label">{t('admin.usersActionsLabel')}</span>
                  <AdminUserActionsCell
                    user={user}
                    state={state}
                    busy={busy}
                    t={t}
                    onMenuAction={onMenuAction}
                    onPrimaryAction={onPrimaryAction}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
