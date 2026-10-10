// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import type pg from 'pg';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from '../domain/auth-password.constants.js';
import { instanceRoleToDbRole } from '../domain/installation-authorization.js';
import type { InstanceRole } from '../domain/instance-role.constants.js';
import { loadAdminResetPasswordAuthContext } from './auth-context.js';

async function createCredentialPassword(
  pool: pg.Pool | pg.PoolClient,
  userId: string,
  password: string
): Promise<void> {
  if (password.length < AUTH_MIN_PASSWORD_LENGTH || password.length > AUTH_MAX_PASSWORD_LENGTH) {
    throw new ValidationError('Password length invalid');
  }
  const ctx = await loadAdminResetPasswordAuthContext();
  const hashedPassword = await ctx.password.hash(password);
  const accountId = randomUUID();
  await pool.query(
    `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, $2, 'credential', $3, $4, now(), now())`,
    [accountId, userId, userId, hashedPassword]
  );
}

export async function provisionInvitedUser(input: {
  pool: pg.Pool | pg.PoolClient;
  email: string;
  name: string;
  role: InstanceRole;
  password: string;
}): Promise<{ userId: string }> {
  const email = input.email.trim().toLowerCase();
  const userId = randomUUID();
  const now = new Date();
  await input.pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, true, $4, $4)`,
    [userId, input.name.trim() || email, email, now]
  );
  await input.pool.query(`INSERT INTO installation_user_roles (user_id, role) VALUES ($1, $2)`, [
    userId,
    instanceRoleToDbRole(input.role),
  ]);
  await createCredentialPassword(input.pool, userId, input.password);
  return { userId };
}
