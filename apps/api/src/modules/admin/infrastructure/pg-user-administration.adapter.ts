// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  buildDescTextIdTiebreakerKeyset,
  decodeIdTiebreakerCursor,
  encodeIdTiebreakerCursor,
} from '../../../shared/infrastructure/pagination/id-tiebreaker-cursor.js';
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
  last_login_at: Date | null;
}

@Injectable()
export class PgUserAdministrationAdapter implements UserAdministrationPort {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listUsers(input: {
    headers: Headers;
    limit: number;
    cursor?: string;
    search?: string;
  }): Promise<{
    users: AdminUserListItem[];
    total: number | null;
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    const searchRaw = input.search?.trim().toLowerCase();
    const fetchLimit = input.limit + 1;
    const params: unknown[] = [];
    let searchClauseUsers = '';
    let searchClauseInvites = '';
    if (searchRaw) {
      params.push(`%${escapeLikePattern(searchRaw)}%`);
      const idx = String(params.length);
      searchClauseUsers = `AND (lower(u.email) LIKE $${idx} ESCAPE '\\' OR lower(u.name) LIKE $${idx} ESCAPE '\\')`;
      searchClauseInvites = `AND (lower(i.invitee_email) LIKE $${idx} ESCAPE '\\' OR lower(i.invitee_name) LIKE $${idx} ESCAPE '\\')`;
    }

    let keysetSql = '';
    if (input.cursor) {
      const decoded = decodeIdTiebreakerCursor(input.cursor);
      const keyset = buildDescTextIdTiebreakerKeyset(
        'sort_at',
        'id',
        decoded,
        params.length + 1,
        '::timestamptz'
      );
      keysetSql = `WHERE ${keyset.conditionSql}`;
      params.push(...keyset.params);
    }

    params.push(fetchLimit);

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
               'user'::text AS row_kind,
               sess.last_login_at
        FROM "user" u
        LEFT JOIN installation_user_roles r ON r.user_id = u.id
        LEFT JOIN installation_user_suspensions s ON s.user_id = u.id
        LEFT JOIN LATERAL (
          SELECT MAX(s2."updatedAt") AS last_login_at
          FROM session s2
          WHERE s2."userId" = u.id
        ) sess ON true
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
               'invite'::text,
               NULL::timestamptz AS last_login_at
        FROM user_invitations i
        WHERE i.accepted_at IS NULL
          AND i.revoked_at IS NULL
          AND i.expires_at > now()
          ${searchClauseInvites}
      )
      SELECT id, name, email, role, reason, expires_at, suspended, sort_at, row_kind, last_login_at
      FROM combined
      ${keysetSql}
      ORDER BY sort_at DESC, id DESC
      LIMIT $${String(params.length)}`;

    const result = await this.pool.query<DirectoryRow>(combinedSql, params);

    let rows = result.rows;
    const hasMore = rows.length > input.limit;
    if (hasMore) {
      rows = rows.slice(0, input.limit);
    }

    const users = rows.map(mapRow);

    let nextCursor: string | null = null;
    if (hasMore && rows.length > 0) {
      const last = rows[rows.length - 1];
      nextCursor = encodeIdTiebreakerCursor({
        v: 1,
        id: last.id,
        sortValue: last.sort_at.toISOString(),
      });
    }

    let total: number | null = null;
    if (!input.cursor) {
      const countParams: unknown[] = [];
      let countSearchClauseUsersInner = '';
      let countSearchClauseInvitesInner = '';
      if (searchRaw) {
        countParams.push(`%${escapeLikePattern(searchRaw)}%`);
        countSearchClauseUsersInner = `AND (lower(u.email) LIKE $1 ESCAPE '\\' OR lower(u.name) LIKE $1 ESCAPE '\\')`;
        countSearchClauseInvitesInner = `AND (lower(i.invitee_email) LIKE $1 ESCAPE '\\' OR lower(i.invitee_name) LIKE $1 ESCAPE '\\')`;
      }
      const countSql = `
        WITH combined AS (
          SELECT u.id
          FROM "user" u
          WHERE true ${countSearchClauseUsersInner}
          UNION ALL
          SELECT i.id::text
          FROM user_invitations i
          WHERE i.accepted_at IS NULL
            AND i.revoked_at IS NULL
            AND i.expires_at > now()
            ${countSearchClauseInvitesInner}
        )
        SELECT COUNT(*)::text AS count FROM combined`;
      const count = await this.pool.query<{ count: string }>(countSql, countParams);
      total = Number(count.rows[0]?.count ?? users.length);
    }

    return { users, total, hasMore, nextCursor };
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
      lastLoginAt: null,
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
    lastLoginAt: row.last_login_at,
  };
}
