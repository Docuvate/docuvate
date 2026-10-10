// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { instanceRoleToDbRole } from '../../auth/domain/installation-authorization.js';
import {
  INSTANCE_ROLE_ADMIN,
  INSTANCE_ROLE_MEMBER,
  type InstanceRole,
  normalizeInstanceRole,
} from '../../auth/domain/instance-role.constants.js';
import { withLastAdministratorGuard } from '../domain/last-admin.policy.js';
import type {
  AdminUserListItem,
  UserAdministrationPort,
} from '../domain/user-administration.port.js';

function escapeLikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

interface DirectoryRow {
  id: string;
  name: string;
  email: string;
  role: string;
  reason: string | null;
  expires_at: Date | null;
  suspended: boolean;
  sort_at: Date;
  row_kind: 'user' | 'invite';
}

@Injectable()
export class PgUserAdministrationAdapter implements UserAdministrationPort {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listUsers(input: {
    headers: Headers;
    limit: number;
    offset: number;
    search?: string;
  }): Promise<{ users: AdminUserListItem[]; total: number }> {
    const searchRaw = input.search?.trim().toLowerCase();
    const params: unknown[] = [input.limit, input.offset];
    let searchClauseUsers = '';
    let searchClauseInvites = '';
    if (searchRaw) {
      params.push(`%${escapeLikePattern(searchRaw)}%`);
      const idx = String(params.length);
      searchClauseUsers = `AND (lower(u.email) LIKE $${idx} ESCAPE '\\' OR lower(u.name) LIKE $${idx} ESCAPE '\\')`;
      searchClauseInvites = `AND (lower(i.invitee_email) LIKE $${idx} ESCAPE '\\' OR lower(i.invitee_name) LIKE $${idx} ESCAPE '\\')`;
    }

    const combinedSql = `
      WITH combined AS (
        SELECT u.id::text AS id,
               u.name,
               u.email,
               COALESCE(r.role, 'installation_member') AS role,
               s.reason,
               s.expires_at,
               EXISTS (
                 SELECT 1 FROM installation_user_suspensions sx
                 WHERE sx.user_id = u.id
                   AND (sx.expires_at IS NULL OR sx.expires_at > now())
               ) AS suspended,
               u."createdAt" AS sort_at,
               'user'::text AS row_kind
        FROM "user" u
        LEFT JOIN installation_user_roles r ON r.user_id = u.id
        LEFT JOIN installation_user_suspensions s ON s.user_id = u.id
        WHERE true ${searchClauseUsers}
        UNION ALL
        SELECT i.id::text,
               i.invitee_name,
               i.invitee_email,
               i.assigned_role,
               NULL::text,
               NULL::timestamptz,
               false,
               i.created_at,
               'invite'::text
        FROM user_invitations i
        WHERE i.accepted_at IS NULL
          AND i.revoked_at IS NULL
          AND i.expires_at > now()
          ${searchClauseInvites}
      )
      SELECT id, name, email, role, reason, expires_at, suspended, sort_at, row_kind
      FROM combined
      ORDER BY sort_at DESC, id
      LIMIT $1 OFFSET $2`;

    const result = await this.pool.query<DirectoryRow>(combinedSql, params);

    const countParams: unknown[] = [];
    let countSearchClauseUsers = '';
    let countSearchClauseInvites = '';
    if (searchRaw) {
      countParams.push(`%${escapeLikePattern(searchRaw)}%`);
      countSearchClauseUsers = `AND (lower(u.email) LIKE $1 ESCAPE '\\' OR lower(u.name) LIKE $1 ESCAPE '\\')`;
      countSearchClauseInvites = `AND (lower(i.invitee_email) LIKE $1 ESCAPE '\\' OR lower(i.invitee_name) LIKE $1 ESCAPE '\\')`;
    }
    const countSql = `
      WITH combined AS (
        SELECT u.id
        FROM "user" u
        WHERE true ${countSearchClauseUsers}
        UNION ALL
        SELECT i.id::text
        FROM user_invitations i
        WHERE i.accepted_at IS NULL
          AND i.revoked_at IS NULL
          AND i.expires_at > now()
          ${countSearchClauseInvites}
      )
      SELECT COUNT(*)::text AS count FROM combined`;
    const count = await this.pool.query<{ count: string }>(countSql, countParams);

    const users = result.rows.map(mapRow);
    return { users, total: Number(count.rows[0]?.count ?? users.length) };
  }

  createUser(input: {
    headers: Headers;
    email: string;
    name: string;
    password: string;
    role: InstanceRole;
  }): Promise<AdminUserListItem> {
    return Promise.reject(
      new Error(`Direct user creation is not supported; use invitations (${input.email})`)
    );
  }

  async setRole(input: { headers: Headers; userId: string; role: InstanceRole }): Promise<void> {
    const dbRole = instanceRoleToDbRole(input.role);
    if (dbRole !== 'installation_admin') {
      await withLastAdministratorGuard(this.pool, input.userId, async (client) => {
        await client.query(
          `INSERT INTO installation_user_roles (user_id, role)
           VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role`,
          [input.userId, dbRole]
        );
      });
      return;
    }
    await this.pool.query(
      `INSERT INTO installation_user_roles (user_id, role)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role`,
      [input.userId, dbRole]
    );
  }

  async banUser(input: { headers: Headers; userId: string; reason?: string }): Promise<void> {
    await withLastAdministratorGuard(this.pool, input.userId, async (client) => {
      await client.query(
        `INSERT INTO installation_user_suspensions (user_id, reason)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET
           reason = EXCLUDED.reason,
           suspended_at = now(),
           expires_at = NULL`,
        [input.userId, input.reason ?? null]
      );
      await client.query(`DELETE FROM session WHERE "userId" = $1`, [input.userId]);
    });
  }

  async unbanUser(input: { headers: Headers; userId: string }): Promise<void> {
    await this.pool.query(`DELETE FROM installation_user_suspensions WHERE user_id = $1`, [
      input.userId,
    ]);
  }

  async revokeSessions(input: { headers: Headers; userId: string }): Promise<void> {
    await this.pool.query(`DELETE FROM session WHERE "userId" = $1`, [input.userId]);
  }
}

function mapRow(row: DirectoryRow): AdminUserListItem {
  if (row.row_kind === 'invite') {
    const role = normalizeInstanceRole(
      row.role === 'installation_admin' ? INSTANCE_ROLE_ADMIN : INSTANCE_ROLE_MEMBER
    );
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role,
      banned: false,
      banReason: null,
      accountStatus: 'invited',
      createdAt: row.sort_at,
    };
  }

  const role = normalizeInstanceRole(
    row.role === 'installation_admin' ? INSTANCE_ROLE_ADMIN : INSTANCE_ROLE_MEMBER
  );
  const suspended = row.suspended && (row.expires_at == null || row.expires_at > new Date());
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    banned: suspended,
    banReason: row.reason,
    accountStatus: suspended ? 'suspended' : 'active',
    createdAt: row.sort_at,
  };
}
