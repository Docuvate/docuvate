import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PgUserInvitationRepository } from '../../src/modules/admin/infrastructure/pg-user-invitation.repository.js';
import { INSTANCE_ROLE_MEMBER } from '../../src/modules/auth/domain/instance-role.constants.js';
import { hashInvitationToken } from '../../src/modules/admin/domain/user-invitation.tokens.js';
import { AcceptUserInvitationUseCase } from '../../src/modules/auth/application/accept-user-invitation.use-case.js';
import { provisionInvitedUser } from '../../src/modules/auth/application/provision-invited-user.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../../src/modules/auth/domain/installation.constants.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';

describe('user invitations (integration)', () => {
  const pool = getIntegrationPool();
  let invitations: PgUserInvitationRepository;

  beforeAll(async () => {
    invitations = new PgUserInvitationRepository(pool);
    await pool.query(`DELETE FROM user_invitations`);
    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM account`);
    await pool.query(`DELETE FROM session`);
    await pool.query(`DELETE FROM "user"`);
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('admin-1', 'Admin One', 'admin@example.com', true, now(), now())
       ON CONFLICT (id) DO NOTHING`
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ('admin-1', $1)
       ON CONFLICT (user_id) DO NOTHING`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
  });

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('pending invite has no user row; revoke leaves zero users', async () => {
    const token = 'test-token-revoke';
    const created = await invitations.createPending({
      inviteeEmail: 'pending.revoke@example.com',
      inviteeName: 'Pending Revoke',
      assignedRole: INSTANCE_ROLE_MEMBER,
      invitedByUserId: 'admin-1',
      tokenHash: hashInvitationToken(token),
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const usersBefore = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user" WHERE lower(email) = $1`,
      ['pending.revoke@example.com']
    );
    expect(usersBefore.rows[0]?.count).toBe('0');

    await invitations.revokeById(created.id);

    const usersAfterRevoke = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user" WHERE lower(email) = $1`,
      ['pending.revoke@example.com']
    );
    expect(usersAfterRevoke.rows[0]?.count).toBe('0');
  });

  it('accept creates exactly one user and marks invitation accepted', async () => {
    const token = 'accept-me-token-value';
    const tokenHash = hashInvitationToken(token);
    const created = await invitations.createPending({
      inviteeEmail: 'accept.me@example.com',
      inviteeName: 'Accept Me',
      assignedRole: INSTANCE_ROLE_MEMBER,
      invitedByUserId: 'admin-1',
      tokenHash,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const accept = new AcceptUserInvitationUseCase(pool);
    await accept.execute({ token, password: 'AcceptMePass12!' });

    const users = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user" WHERE lower(email) = $1`,
      ['accept.me@example.com']
    );
    expect(users.rows[0]?.count).toBe('1');

    const row = await pool.query<{ accepted_at: Date | null }>(
      `SELECT accepted_at FROM user_invitations WHERE id = $1`,
      [created.id]
    );
    expect(row.rows[0]?.accepted_at).toBeTruthy();
  });

  it('only one parallel accept succeeds for the same token', async () => {
    const token = 'parallel-accept-token';
    const tokenHash = hashInvitationToken(token);
    await invitations.createPending({
      inviteeEmail: 'parallel.accept@example.com',
      inviteeName: 'Parallel',
      assignedRole: INSTANCE_ROLE_MEMBER,
      invitedByUserId: 'admin-1',
      tokenHash,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const accept = new AcceptUserInvitationUseCase(pool);
    const results = await Promise.allSettled([
      accept.execute({ token, password: 'ParallelPass12!!' }),
      accept.execute({ token, password: 'ParallelPass12!!' }),
    ]);
    const successes = results.filter((r) => r.status === 'fulfilled');
    expect(successes).toHaveLength(1);

    const users = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user" WHERE lower(email) = $1`,
      ['parallel.accept@example.com']
    );
    expect(users.rows[0]?.count).toBe('1');
  });

  it('provisionInvitedUser satisfies accept path contract', async () => {
    const { userId } = await provisionInvitedUser({
      pool,
      email: 'direct.provision@example.com',
      name: 'Direct',
      role: INSTANCE_ROLE_MEMBER,
      password: 'DirectPass12!!',
    });
    expect(userId).toBeTruthy();
  });
});
