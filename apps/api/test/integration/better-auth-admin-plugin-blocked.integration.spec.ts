import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { INSTALLATION_DB_ROLE_ADMIN } from '../../src/modules/auth/domain/installation.constants.js';
import { INSTANCE_ROLE_MEMBER } from '../../src/modules/auth/domain/instance-role.constants.js';
import { auth } from '../../src/shared/infrastructure/auth/better-auth.config.js';
import { isBetterAuthAdminPluginPath } from '../../src/shared/infrastructure/auth/block-better-auth-admin-routes.js';
import { registerBetterAuthHttpRoutes } from '../../src/shared/infrastructure/auth/register-better-auth-http-routes.js';
import { getIntegrationPool } from './pg-pool.js';

describe('better-auth admin plugin HTTP surface (integration)', () => {
  const pool = getIntegrationPool();
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    registerBetterAuthHttpRoutes(app, auth);
    await app.ready();

    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM session`);
    await pool.query(`DELETE FROM account`);
    await pool.query(`DELETE FROM "user"`);
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('solo-admin', 'Solo Admin', 'solo-admin@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ('solo-admin', $1)`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('classifies plugin admin paths', () => {
    expect(isBetterAuthAdminPluginPath('/api/auth/admin/set-role')).toBe(true);
    expect(isBetterAuthAdminPluginPath('/api/auth/admin/impersonate-user')).toBe(true);
    expect(isBetterAuthAdminPluginPath('/api/auth/sign-in/email')).toBe(false);
  });

  it('returns 404 for /api/auth/admin/set-role (Nest IAM owns role changes + last-admin guard)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/admin/set-role',
      payload: {
        userId: 'solo-admin',
        role: INSTANCE_ROLE_MEMBER,
      },
    });
    expect(response.statusCode).toBe(404);
    const row = await pool.query<{ role: string }>(
      `SELECT role FROM installation_user_roles WHERE user_id = 'solo-admin'`
    );
    expect(row.rows[0]?.role).toBe(INSTALLATION_DB_ROLE_ADMIN);
  });

  it('returns 404 for /api/auth/admin/impersonate-user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/admin/impersonate-user',
      payload: { userId: 'solo-admin' },
    });
    expect(response.statusCode).toBe(404);
  });
});
