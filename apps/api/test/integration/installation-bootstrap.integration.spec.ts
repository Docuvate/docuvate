import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assignInstallationRoleAfterSignUp } from '../../src/modules/auth/infrastructure/instance-user-bootstrap.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../../src/modules/auth/domain/installation.constants.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';

const installationIamBackfillSql = readFileSync(
  join(
    __dirname,
    '../../src/shared/infrastructure/database/migrations/sql/installation-iam-up.sql'
  ),
  'utf8'
).match(/INSERT INTO installation_user_roles[\s\S]+?ON CONFLICT \(user_id\) DO NOTHING;/)?.[0];

describe('installation bootstrap (integration)', () => {
  const pool = getIntegrationPool();

  beforeAll(async () => {
    await pool.query(`DELETE FROM installation_user_suspensions`);
    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM account`);
    await pool.query(`DELETE FROM session`);
    await pool.query(`DELETE FROM "user"`);
  });

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('backfills oldest user as admin when no admin row exists', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES
         ('older', 'Older', 'older@example.com', true, now() - interval '2 days', now()),
         ('newer', 'Newer', 'newer@example.com', true, now(), now())`
    );
    if (!installationIamBackfillSql) {
      throw new Error('installation IAM backfill SQL not found in migration file');
    }
    await pool.query(installationIamBackfillSql);
    const admins = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM installation_user_roles WHERE role = $1`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    expect(admins.rows.map((r) => r.user_id)).toEqual(['older']);
    await pool.query(installationIamBackfillSql);
    const adminsAfter = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM installation_user_roles WHERE role = $1`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    expect(adminsAfter.rows).toHaveLength(1);
    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM "user" WHERE id IN ('older', 'newer')`);
  });

  it('concurrent bootstrap assigns exactly one admin', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES
         ('race-a', 'Race A', 'race-a@example.com', true, now(), now()),
         ('race-b', 'Race B', 'race-b@example.com', true, now(), now())`
    );
    await Promise.all([
      assignInstallationRoleAfterSignUp(pool, 'race-a'),
      assignInstallationRoleAfterSignUp(pool, 'race-b'),
    ]);
    const admins = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM installation_user_roles WHERE role = $1`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    expect(admins.rows).toHaveLength(1);
    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM "user" WHERE id IN ('race-a', 'race-b')`);
  });

  it('assigns admin only while no installation_admin row exists', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('first', 'First', 'first@example.com', true, now(), now())`
    );
    await assignInstallationRoleAfterSignUp(pool, 'first');
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('second', 'Second', 'second@example.com', true, now(), now())`
    );
    await assignInstallationRoleAfterSignUp(pool, 'second');
    const roles = await pool.query<{ user_id: string; role: string }>(
      `SELECT user_id, role FROM installation_user_roles ORDER BY user_id`
    );
    expect(roles.rows).toEqual([
      { user_id: 'first', role: INSTALLATION_DB_ROLE_ADMIN },
      { user_id: 'second', role: 'installation_member' },
    ]);
  });
});
