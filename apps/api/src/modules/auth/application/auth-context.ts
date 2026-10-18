// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { auth } from '../../../shared/infrastructure/auth/better-auth.config.js';
import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';
import type { AdminResetPasswordAuthContext } from './admin-reset-password.use-case.js';

function isAdminResetPasswordAuthContext(value: unknown): value is AdminResetPasswordAuthContext {
  if (!isRecord(value)) {
    return false;
  }
  if (!('internalAdapter' in value) || !('password' in value)) {
    return false;
  }
  const internalAdapter = value.internalAdapter;
  const password = value.password;
  if (!isRecord(internalAdapter) || !isRecord(password)) {
    return false;
  }
  return (
    typeof internalAdapter.findUserByEmail === 'function' &&
    typeof internalAdapter.findCredentialAccount === 'function' &&
    typeof internalAdapter.updatePassword === 'function' &&
    typeof internalAdapter.createAccount === 'function' &&
    typeof internalAdapter.deleteUserSessions === 'function' &&
    typeof password.hash === 'function'
  );
}

export async function loadAdminResetPasswordAuthContext(): Promise<AdminResetPasswordAuthContext> {
  const ctx: unknown = await auth.$context;
  if (!isAdminResetPasswordAuthContext(ctx)) {
    throw new Error('Better Auth context is not available');
  }
  return ctx;
}
