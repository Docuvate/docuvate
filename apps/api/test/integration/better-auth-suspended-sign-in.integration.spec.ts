import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auth } from '../../src/shared/infrastructure/auth/better-auth.config.js';
import { registerBetterAuthHttpRoutes } from '../../src/shared/infrastructure/auth/register-better-auth-http-routes.js';
import { getIntegrationPool } from './pg-pool.js';

const WEB_ORIGIN = 'http://localhost:5173';

describe('better-auth suspended user sign-in (integration)', () => {
  const pool = getIntegrationPool();
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    app = Fastify();
    registerBetterAuthHttpRoutes(app, auth);
    await app.ready();
    await pool.query(`DELETE FROM installation_user_suspensions`);
    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM session`);
    await pool.query(`DELETE FROM account`);
    await pool.query(`DELETE FROM "user"`);
    process.env['DV_ALLOW_SIGNUP'] = 'true';
  });

  afterAll(async () => {
    await app.close();
    delete process.env['DV_ALLOW_SIGNUP'];
  });

  it('rejects sign-in for a suspended user and creates no session', async () => {
    const email = 'suspended-signin@example.com';
    const password = 'SuspendedUserDemo12!';
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      headers: { origin: WEB_ORIGIN, 'content-type': 'application/json' },
      payload: { email, password, name: 'Suspended User' },
    });
    expect(signUp.statusCode).toBe(200);
    const userRow = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE lower(email) = lower($1)`,
      [email]
    );
    const userId = userRow.rows[0]?.id;
    expect(userId).toBeTruthy();
    await pool.query(`INSERT INTO installation_user_suspensions (user_id) VALUES ($1)`, [userId]);

    const signIn = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      headers: { origin: WEB_ORIGIN, 'content-type': 'application/json' },
      payload: { email, password },
    });
    expect(signIn.statusCode).toBeGreaterThanOrEqual(400);
    if (signIn.headers['content-type']?.includes('application/json')) {
      const body = signIn.json() as { token?: string };
      expect(body.token).toBeUndefined();
    }

    await pool.query(`DELETE FROM installation_user_suspensions WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
    await pool.query(`DELETE FROM account WHERE "userId" = $1`, [userId]);
    await pool.query(`DELETE FROM installation_user_roles WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);
  });
});
