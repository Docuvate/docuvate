// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';
import { ForbiddenError } from '../../../shared/domain/errors.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../../auth/domain/installation.constants.js';
import { INSTANCE_ROLE_ADMIN } from '../../auth/domain/instance-role.constants.js';
import { ValidationError } from '../../../shared/domain/errors.js';

export function assertRoleChangeAllowed(nextRole: string): void {
  if (nextRole !== INSTANCE_ROLE_ADMIN && nextRole !== 'member') {
    throw new ValidationError('Invalid role');
  }
}

export async function countActiveInstallationAdministrators(
  client: pg.Pool | pg.PoolClient
): Promise<number> {
  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM installation_user_roles r
     LEFT JOIN installation_user_suspensions s ON s.user_id = r.user_id
     WHERE r.role = $1
       AND (s.user_id IS NULL OR (s.expires_at IS NOT NULL AND s.expires_at <= now()))`,
    [INSTALLATION_DB_ROLE_ADMIN]
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function lockInstallationAdministratorRows(client: pg.PoolClient): Promise<void> {
  await client.query(
    `SELECT r.user_id
     FROM installation_user_roles r
     WHERE r.role = $1
     FOR UPDATE`,
    [INSTALLATION_DB_ROLE_ADMIN]
  );
}

/** Fail if target is the sole active installation administrator (call inside a transaction). */
export async function assertNotLastAdministratorInTransaction(
  client: pg.PoolClient,
  targetUserId: string
): Promise<void> {
  const target = await client.query<{ role: string }>(
    `SELECT role FROM installation_user_roles WHERE user_id = $1`,
    [targetUserId]
  );
  if (target.rows[0]?.role !== INSTALLATION_DB_ROLE_ADMIN) {
    return;
  }
  const adminCount = await countActiveInstallationAdministrators(client);
  if (adminCount <= 1) {
    throw new ForbiddenError('admin.errors.lastAdministrator');
  }
}

/** Prefer adapter transactional guards; used by integration tests. */
export async function assertTargetIsNotLastAdministrator(
  pool: pg.Pool,
  targetUserId: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockInstallationAdministratorRows(client);
    await assertNotLastAdministratorInTransaction(client, targetUserId);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function withLastAdministratorGuard<T>(
  pool: pg.Pool,
  targetUserId: string,
  run: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await lockInstallationAdministratorRows(client);
    await assertNotLastAdministratorInTransaction(client, targetUserId);
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
