// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type AdminUserDto, CURSOR_LIST_DEFAULT_LIMIT, type InstanceRole } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSettingsLayout } from '../../components/admin/AdminSettingsLayout';
import type { AdminUserMenuAction } from '../../components/admin/AdminUserRowActions';
import { AdminUsersInvitePanel } from '../../components/admin/AdminUsersInvitePanel';
import { AdminUsersTable } from '../../components/admin/AdminUsersTable';
import { useToast } from '../../components/save/ToastProvider';
import { SettingsBreadcrumb } from '../../components/settings/SettingsBreadcrumb';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { formatAdminUserFacingError } from '../../lib/adminErrors';
import {
  banAdminUser,
  inviteAdminUser,
  listAdminUsersPage,
  resendAdminUserInvitation,
  revokeAdminUserInvitation,
  revokeAdminUserSessions,
  setAdminUserRole,
  unbanAdminUser,
} from '../../lib/api';
import { authClient, authSessionUserId } from '../../lib/auth-client';
import { routes } from '../../lib/routes';

type PendingAction =
  | { kind: 'ban'; user: AdminUserDto }
  | { kind: 'unban'; user: AdminUserDto }
  | { kind: 'revoke'; user: AdminUserDto }
  | { kind: 'demote'; user: AdminUserDto; nextRole: InstanceRole }
  | { kind: 'revoke-invite'; user: AdminUserDto }
  | { kind: 'resend-invite'; user: AdminUserDto };

export function AdminUsersPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: session } = authClient.useSession();
  const currentUserId = authSessionUserId(session) ?? null;
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCursors, setPageCursors] = useState<(string | undefined)[]>([undefined]);
  const [loadError, setLoadError] = useState(false);
  const [reloadBusy, setReloadBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InstanceRole>('member');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const activeCursor = pageCursors[pageIndex];

  const reload = useCallback(async () => {
    setReloadBusy(true);
    try {
      const list = await listAdminUsersPage({
        cursor: activeCursor,
        limit: CURSOR_LIST_DEFAULT_LIMIT,
      });
      setUsers(list.users);
      setListTotal(list.total ?? list.users.length);
      setHasMore(list.hasMore);
      setPageCursors((prev) => {
        const copy = [...prev];
        copy[pageIndex + 1] = list.nextCursor ?? undefined;
        return copy.slice(0, pageIndex + 2);
      });
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setReloadBusy(false);
    }
  }, [activeCursor, pageIndex]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const paginationRange = useMemo(() => {
    if (users.length === 0) {
      return { from: 0, to: 0, total: listTotal };
    }
    const from = pageIndex * CURSOR_LIST_DEFAULT_LIMIT + 1;
    const to = pageIndex * CURSOR_LIST_DEFAULT_LIMIT + users.length;
    return { from, to, total: listTotal };
  }, [listTotal, pageIndex, users.length]);

  function goToNextPage() {
    if (!hasMore) {
      return;
    }
    setPageIndex((index) => index + 1);
  }

  function goToPreviousPage() {
    setPageIndex((index) => Math.max(0, index - 1));
  }

  function notifyActionError(err: unknown, fallbackKey: string) {
    toast.error(formatAdminUserFacingError(err, fallbackKey));
  }

  async function runInvite() {
    setBusy(true);
    try {
      const email = inviteEmail.trim();
      await inviteAdminUser({
        email,
        name: email.split('@')[0] ?? email,
        role: inviteRole,
      });
      setInviteEmail('');
      toast.success(t('admin.usersInviteSuccess'));
      setPageIndex(0);
      setPageCursors([undefined]);
      await reload();
    } catch (err) {
      notifyActionError(err, 'admin.usersInviteFailed');
    } finally {
      setBusy(false);
    }
  }

  function requestRoleChange(user: AdminUserDto, role: InstanceRole) {
    if (user.role === role) return;
    if (user.role === 'admin' && role === 'member') {
      setPending({ kind: 'demote', user, nextRole: role });
      return;
    }
    void applyRoleChange(user, role);
  }

  async function applyRoleChange(user: AdminUserDto, role: InstanceRole) {
    setBusy(true);
    try {
      await setAdminUserRole(user.id, { role });
      await reload();
      toast.success();
    } catch (err) {
      notifyActionError(err, 'admin.usersRoleFailed');
    } finally {
      setBusy(false);
    }
  }

  function openMenuAction(action: AdminUserMenuAction) {
    setPending(action);
  }

  async function confirmPending() {
    if (!pending) return;
    setBusy(true);
    try {
      switch (pending.kind) {
        case 'ban':
          await banAdminUser(pending.user.id, {});
          break;
        case 'unban':
          await unbanAdminUser(pending.user.id);
          break;
        case 'revoke':
          await revokeAdminUserSessions(pending.user.id);
          break;
        case 'demote':
          await applyRoleChange(pending.user, pending.nextRole);
          break;
        case 'revoke-invite':
          await revokeAdminUserInvitation(pending.user.id);
          break;
        case 'resend-invite':
          await resendAdminUserInvitation(pending.user.id);
          break;
        default: {
          const _exhaustive: never = pending;
          return _exhaustive;
        }
      }
      if (pending.kind !== 'demote') {
        await reload();
        toast.success();
      }
      setPending(null);
    } catch (err) {
      notifyActionError(err, 'errors.saveFailed');
    } finally {
      setBusy(false);
    }
  }

  function pendingCopy(): {
    title: string;
    description: string;
    tone: 'danger' | 'default';
    confirmLabel: string;
  } {
    if (!pending) {
      return { title: '', description: '', tone: 'default', confirmLabel: '' };
    }
    switch (pending.kind) {
      case 'ban':
        return {
          title: t('admin.usersBanConfirmTitle'),
          description: t('admin.usersBanConfirmBody', { email: pending.user.email }),
          tone: 'danger',
          confirmLabel: t('admin.usersBan'),
        };
      case 'unban':
        return {
          title: t('admin.usersUnbanConfirmTitle'),
          description: t('admin.usersUnbanConfirmBody', { email: pending.user.email }),
          tone: 'default',
          confirmLabel: t('admin.usersUnban'),
        };
      case 'revoke':
        return {
          title: t('admin.usersRevokeConfirmTitle'),
          description: t('admin.usersRevokeConfirmBody', { email: pending.user.email }),
          tone: 'default',
          confirmLabel: t('admin.usersRevokeSessions'),
        };
      case 'demote':
        return {
          title: t('admin.usersDemoteConfirmTitle'),
          description: t('admin.usersDemoteConfirmBody', {
            name: pending.user.name,
            email: pending.user.email,
          }),
          tone: 'danger',
          confirmLabel: t('admin.usersDemoteConfirmAction'),
        };
      case 'revoke-invite':
        return {
          title: t('admin.usersRevokeInviteConfirmTitle'),
          description: t('admin.usersRevokeInviteConfirmBody', { email: pending.user.email }),
          tone: 'danger',
          confirmLabel: t('admin.usersRevokeInvite'),
        };
      case 'resend-invite':
        return {
          title: t('admin.usersResendInviteConfirmTitle'),
          description: t('admin.usersResendInviteConfirmBody', { email: pending.user.email }),
          tone: 'default',
          confirmLabel: t('admin.usersResendInvite'),
        };
      default: {
        const _never: never = pending;
        return _never;
      }
    }
  }

  const dialog = pendingCopy();

  const usersBreadcrumb = (
    <SettingsBreadcrumb
      items={[
        { label: t('admin.hubTitle'), to: routes.settingsAdmin },
        { label: t('admin.usersTitle') },
      ]}
    />
  );

  return (
    <AdminSettingsLayout
      sectionTitle={t('admin.usersTitle')}
      sectionLead={t('admin.usersLead')}
      sectionBreadcrumb={usersBreadcrumb}
    >
      {loadError ? (
        <div className="admin-load-error" role="alert">
          <p className="error">{t('admin.usersLoadFailed')}</p>
          <Button
            type="button"
            variant="secondary"
            disabled={reloadBusy}
            onClick={() => void reload()}
          >
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      <AdminUsersInvitePanel
        busy={busy}
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        onEmailChange={setInviteEmail}
        onRoleChange={setInviteRole}
        onSubmit={() => void runInvite()}
      />

      <section className="settings-section-card admin-users-panel">
        {!loadError ? (
          <>
            <AdminUsersTable
              users={users}
              busy={busy}
              currentUserId={currentUserId}
              soleAdministratorUserId={
                users.filter((u) => u.role === 'admin' && u.accountStatus !== 'invited').length ===
                1
                  ? (users.find((u) => u.role === 'admin' && u.accountStatus !== 'invited')?.id ??
                    null)
                  : null
              }
              onRoleChange={requestRoleChange}
              onMenuAction={openMenuAction}
            />
            <Pagination
              from={paginationRange.from}
              to={paginationRange.to}
              total={paginationRange.total}
              onPrevious={pageIndex > 0 ? goToPreviousPage : undefined}
              onNext={hasMore ? goToNextPage : undefined}
              previousDisabled={pageIndex === 0 || reloadBusy}
              nextDisabled={!hasMore || reloadBusy}
              className="admin-users-pagination"
            />
          </>
        ) : null}
      </section>

      <ConfirmDialog
        open={pending !== null}
        title={dialog.title}
        description={dialog.description}
        tone={dialog.tone}
        busy={busy}
        confirmLabel={dialog.confirmLabel}
        onConfirm={() => void confirmPending()}
        onCancel={() => { setPending(null); }}
      />
    </AdminSettingsLayout>
  );
}
