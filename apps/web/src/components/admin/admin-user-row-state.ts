import type { AdminUserDto } from '@docuvate/contracts';

export type UserRowState = {
  self: boolean;
  soleAdmin: boolean;
  roleDisabled: boolean;
  readonlyHint: string | undefined;
  actionsDisabled: boolean;
};

export function getUserRowState(
  user: AdminUserDto,
  busy: boolean,
  currentUserId: string | null,
  soleAdministratorUserId: string | null,
  t: (key: string) => string
): UserRowState {
  const self = currentUserId != null && user.id === currentUserId;
  const soleAdmin = soleAdministratorUserId != null && user.id === soleAdministratorUserId;
  const roleDisabled = busy || user.accountStatus === 'invited' || self || soleAdmin;
  const lastAdminHint = soleAdmin ? t('admin.errors.lastAdministrator') : undefined;
  const selfRoleHint = self && !soleAdmin ? t('admin.usersSelfRoleHint') : undefined;
  const readonlyHint = lastAdminHint ?? selfRoleHint;
  const actionsDisabled = self || busy;
  return { self, soleAdmin, roleDisabled, readonlyHint, actionsDisabled };
}

export function validateInviteForm(email: string): boolean {
  return email.trim().includes('@');
}

export function invitePasswordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

export function isTwoFactorSubmitEnabled(code: string, loading: boolean): boolean {
  return !loading && code.trim().length > 0;
}
