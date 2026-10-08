import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  assertTargetIsNotLastAdministrator,
  countActiveInstallationAdministrators,
} from '../../src/modules/admin/domain/last-admin.policy.js';
import { SetAdminUserRoleUseCase } from '../../src/modules/admin/application/admin.use-cases.js';
import { ForbiddenError } from '../../src/shared/domain/errors.js';
import {
  INSTANCE_ROLE_ADMIN,
  INSTANCE_ROLE_MEMBER,
} from '../../src/modules/auth/domain/instance-role.constants.js';
import { AdminGuard } from '../../src/shared/infrastructure/auth/admin.guard.js';
import { PgUserAdministrationAdapter } from '../../src/modules/admin/infrastructure/pg-user-administration.adapter.js';
import type { AuthorizationSubject } from '../../src/shared/domain/authorization.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../../src/modules/auth/domain/installation.constants.js';
import { INSTALLATION_TENANT_ID } from '../../src/modules/auth/domain/installation.constants.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';

describe('admin security (integration)', () => {
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

  it('administrator cannot change own role via SetAdminUserRoleUseCase', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('self-admin', 'Self Admin', 'self@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ('self-admin', $1)`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    const users = { setRole: vi.fn() };
    const useCase = new SetAdminUserRoleUseCase(users as never, pool);

    await expect(
      useCase.execute({
        actorUserId: 'self-admin',
        headers: new Headers(),
        userId: 'self-admin',
        role: INSTANCE_ROLE_MEMBER,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(users.setRole).not.toHaveBeenCalled();
    await pool.query(`DELETE FROM installation_user_roles WHERE user_id = 'self-admin'`);
    await pool.query(`DELETE FROM "user" WHERE id = 'self-admin'`);
  });

  it('last administrator cannot be demoted via policy guard', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('solo-admin', 'Solo Admin', 'solo@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ('solo-admin', $1)`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    expect(await countActiveInstallationAdministrators(pool)).toBe(1);
    await expect(assertTargetIsNotLastAdministrator(pool, 'solo-admin')).rejects.toBeInstanceOf(
      ForbiddenError
    );
    await pool.query(`DELETE FROM installation_user_roles WHERE user_id = 'solo-admin'`);
    await pool.query(`DELETE FROM "user" WHERE id = 'solo-admin'`);
  });

  it('non-admin subject fails AdminGuard (403 contract)', () => {
    const guard = new AdminGuard();
    const memberSubject: AuthorizationSubject = {
      kind: 'user',
      id: 'member-1',
      tenantId: INSTALLATION_TENANT_ID,
      roles: [INSTANCE_ROLE_MEMBER],
      claims: ['document:*'],
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ authSubject: memberSubject }),
      }),
    };
    expect(() => guard.canActivate(context as never)).toThrow(ForbiddenError);
  });

  it('lists pending invitations as invited', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('inviter', 'Inviter', 'inviter@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ('inviter', $1)`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    await pool.query(
      `INSERT INTO user_invitations (
         id, invitee_email, invitee_name, assigned_role, invited_by_user_id, token_hash, expires_at
       ) VALUES (
         '11111111-1111-4111-8111-111111111111',
         'pending@example.com',
         'Pending User',
         'installation_member',
         'inviter',
         'hash',
         now() + interval '7 days'
       )`
    );
    const adapter = new PgUserAdministrationAdapter(pool);
    const { users } = await adapter.listUsers({
      headers: new Headers(),
      limit: 50,
      offset: 0,
    });
    const invite = users.find((u) => u.email === 'pending@example.com');
    expect(invite?.accountStatus).toBe('invited');
    await pool.query(`DELETE FROM user_invitations`);
    await pool.query(`DELETE FROM installation_user_roles WHERE user_id = 'inviter'`);
    await pool.query(`DELETE FROM "user" WHERE id = 'inviter'`);
  });

  it('searches and paginates users with pending invites', async () => {
    const adapter = new PgUserAdministrationAdapter(pool);
    await pool.query(`DELETE FROM user_invitations`);
    await pool.query(`DELETE FROM installation_user_suspensions`);
    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(`DELETE FROM session`);
    await pool.query(`DELETE FROM account`);
    await pool.query(`DELETE FROM "user"`);

    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES
         ('u-alpha', 'Alpha Search', 'alpha.search@example.com', true, now() - interval '1 hour', now()),
         ('u-beta', 'Beta Other', 'beta.other@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO user_invitations (
         id, invitee_email, invitee_name, assigned_role, invited_by_user_id, token_hash, expires_at, created_at
       ) VALUES (
         '22222222-2222-4222-8222-222222222222',
         'gamma.search@example.com',
         'Gamma Search',
         'installation_member',
         'u-beta',
         'hash2',
         now() + interval '7 days',
         now() - interval '30 minutes'
       )`
    );

    const searchResult = await adapter.listUsers({
      headers: new Headers(),
      limit: 10,
      offset: 0,
      search: 'search',
    });
    expect(searchResult.total).toBe(2);
    expect(searchResult.users.map((u) => u.email).sort()).toEqual([
      'alpha.search@example.com',
      'gamma.search@example.com',
    ]);

    const page1 = await adapter.listUsers({
      headers: new Headers(),
      limit: 1,
      offset: 0,
      search: 'search',
    });
    expect(page1.total).toBe(2);
    expect(page1.users).toHaveLength(1);

    const page2 = await adapter.listUsers({
      headers: new Headers(),
      limit: 1,
      offset: 1,
      search: 'search',
    });
    expect(page2.total).toBe(2);
    expect(page2.users).toHaveLength(1);
    expect(page1.users[0]!.id).not.toBe(page2.users[0]!.id);
    expect(new Set([page1.users[0]!.email, page2.users[0]!.email]).size).toBe(2);

    const wildcard = await adapter.listUsers({
      headers: new Headers(),
      limit: 10,
      offset: 0,
      search: 'a%_',
    });
    expect(wildcard.total).toBe(0);

    await pool.query(`DELETE FROM user_invitations`);
    await pool.query(`DELETE FROM "user" WHERE id IN ('u-alpha', 'u-beta')`);
  });

  it('omits expired pending invitations from the directory', async () => {
    await pool.query(`DELETE FROM user_invitations`);
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('inviter-2', 'Inviter', 'inviter2@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO user_invitations (
         id, invitee_email, invitee_name, assigned_role, invited_by_user_id, token_hash, expires_at
       ) VALUES (
         '33333333-3333-4333-8333-333333333333',
         'expired@example.com',
         'Expired',
         'installation_member',
         'inviter-2',
         'hash-expired',
         now() - interval '1 day'
       )`
    );
    const adapter = new PgUserAdministrationAdapter(pool);
    const { users, total } = await adapter.listUsers({
      headers: new Headers(),
      limit: 50,
      offset: 0,
    });
    expect(total).toBe(1);
    expect(users.some((u) => u.email === 'expired@example.com')).toBe(false);
    await pool.query(`DELETE FROM user_invitations`);
    await pool.query(`DELETE FROM "user" WHERE id = 'inviter-2'`);
  });

  it('lists suspended users without a reason as suspended', async () => {
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ('suspended-user', 'Suspended', 'suspended@example.com', true, now(), now())`
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ('suspended-user', $1)`,
      [INSTALLATION_DB_ROLE_ADMIN]
    );
    await pool.query(`INSERT INTO installation_user_suspensions (user_id) VALUES ('suspended-user')`);
    const adapter = new PgUserAdministrationAdapter(pool);
    const { users } = await adapter.listUsers({
      headers: new Headers(),
      limit: 50,
      offset: 0,
    });
    const row = users.find((u) => u.id === 'suspended-user');
    expect(row?.accountStatus).toBe('suspended');
    expect(row?.banned).toBe(true);
    await pool.query(`DELETE FROM installation_user_suspensions WHERE user_id = 'suspended-user'`);
    await pool.query(`DELETE FROM installation_user_roles WHERE user_id = 'suspended-user'`);
    await pool.query(`DELETE FROM "user" WHERE id = 'suspended-user'`);
  });

  it('administrator passes AdminGuard', () => {
    const guard = new AdminGuard();
    const adminSubject: AuthorizationSubject = {
      kind: 'user',
      id: 'admin-1',
      tenantId: INSTALLATION_TENANT_ID,
      roles: [INSTANCE_ROLE_ADMIN, INSTANCE_ROLE_MEMBER],
      claims: ['document:*', 'admin:*'],
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ authSubject: adminSubject }),
      }),
    };
    expect(guard.canActivate(context as never)).toBe(true);
  });
});
