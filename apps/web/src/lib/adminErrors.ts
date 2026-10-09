// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import i18n from '../i18n';
import { toUserFacingError, type UserFacingError } from './apiErrors';

const ADMIN_MESSAGE_ALIASES: Record<string, string> = {
  'Cannot modify the last administrator': 'admin.errors.lastAdministrator',
  'No pending invitation for this user': 'admin.errors.noPendingInvitation',
  'Invalid email': 'admin.errors.invalidEmail',
  'Invitation link is invalid or expired': 'admin.errors.invitationInvalid',
};

export function toAdminUserFacingError(err: unknown, fallbackKey: string): UserFacingError {
  const base = toUserFacingError(err, fallbackKey);
  if (base.i18nKey.startsWith('admin.')) {
    return base;
  }

  const parsed = err instanceof Error ? err.message : '';
  if (parsed && ADMIN_MESSAGE_ALIASES[parsed]) {
    return { i18nKey: ADMIN_MESSAGE_ALIASES[parsed], retryable: false };
  }

  if (base.i18nKey === 'errors.forbidden' || base.i18nKey === 'errors.conflict') {
    return { i18nKey: 'admin.errors.actionNotAllowed', retryable: false };
  }

  return base;
}

export function formatAdminUserFacingError(err: unknown, fallbackKey: string): string {
  const facing = toAdminUserFacingError(err, fallbackKey);
  return i18n.t(facing.i18nKey, facing.params ?? {});
}
