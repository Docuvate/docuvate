// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createAuthMiddleware } from 'better-auth/api';
import type pg from 'pg';

import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { enforcePasswordPolicyForBetterAuth } from '../application/enforce-password-policy.js';
import { loadPasswordPolicyForPool } from './password-policy-runtime.js';

const POLICY_PATHS = new Set(['/sign-up/email', '/reset-password', '/change-password']);

function passwordFromAuthBody(path: string, body: unknown): string | null {
  if (!isRecord(body)) {
    return null;
  }
  if (path === '/sign-up/email') {
    const value = body.password;
    return typeof value === 'string' ? value : null;
  }
  const newPassword = body.newPassword;
  return typeof newPassword === 'string' ? newPassword : null;
}

export function createBetterAuthPasswordPolicyBeforeHook(pool: pg.Pool) {
  return createAuthMiddleware(async (ctx) => {
    const path = ctx.path;
    if (!path || !POLICY_PATHS.has(path)) {
      return;
    }
    const password = passwordFromAuthBody(path, ctx.body);
    if (!password) {
      return;
    }
    const policy = await loadPasswordPolicyForPool(pool);
    await enforcePasswordPolicyForBetterAuth(policy, password);
  });
}
