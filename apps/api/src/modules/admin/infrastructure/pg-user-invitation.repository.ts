// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { instanceRoleToDbRole } from '../../auth/domain/installation-authorization.js';
import { dbRoleToInstanceRole } from '../../auth/domain/installation-authorization.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type {
  UserInvitationRecord,
  UserInvitationRepository,
} from '../domain/user-invitation.types.js';

const SELECT_INVITATION = `
  SELECT ui.id,
         ui.invitee_email AS email,
         ui.invitee_name AS invited_name,
         ui.assigned_role,
         ui.invited_by_user_id,
         ui.expires_at,
         ui.accepted_at,
         ui.revoked_at,
         ui.created_at
  FROM user_invitations ui
`;

@Injectable()
export class PgUserInvitationRepository implements UserInvitationRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async createPending(input: {
    inviteeEmail: string;
    inviteeName: string;
    assignedRole: UserInvitationRecord['assignedRole'];
    invitedByUserId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<UserInvitationRecord> {
    await this.revokeActiveForEmail(input.inviteeEmail);
    const email = input.inviteeEmail.trim().toLowerCase();
    const name = input.inviteeName.trim() || input.inviteeEmail;
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO user_invitations (
         invitee_email, invitee_name, assigned_role,
         invited_by_user_id, token_hash, expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        email,
        name,
        instanceRoleToDbRole(input.assignedRole),
        input.invitedByUserId,
        input.tokenHash,
        input.expiresAt,
      ]
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new Error('Failed to create invitation');
    }
    return this.requireById(String(id));
  }

  async findActiveById(id: string): Promise<UserInvitationRecord | null> {
    const result = await this.pool.query<Row>(
      `${SELECT_INVITATION}
       WHERE ui.id = $1
         AND ui.accepted_at IS NULL
         AND ui.revoked_at IS NULL
         AND ui.expires_at > now()
       LIMIT 1`,
      [id]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async findActiveByInviteeEmail(email: string): Promise<UserInvitationRecord | null> {
    const normalized = email.trim().toLowerCase();
    const result = await this.pool.query<Row>(
      `${SELECT_INVITATION}
       WHERE lower(ui.invitee_email) = $1
         AND ui.accepted_at IS NULL
         AND ui.revoked_at IS NULL
         AND ui.expires_at > now()
       ORDER BY ui.created_at DESC
       LIMIT 1`,
      [normalized]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<UserInvitationRecord | null> {
    const result = await this.pool.query<Row>(
      `${SELECT_INVITATION} WHERE ui.token_hash = $1 LIMIT 1`,
      [tokenHash]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async revokeById(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE user_invitations SET revoked_at = now()
       WHERE id = $1 AND accepted_at IS NULL AND revoked_at IS NULL`,
      [id]
    );
  }

  async listPendingWithoutUser(): Promise<UserInvitationRecord[]> {
    await this.purgeExpired();
    const result = await this.pool.query<Row>(
      `${SELECT_INVITATION}
       WHERE ui.accepted_at IS NULL
         AND ui.revoked_at IS NULL
         AND ui.expires_at > now()
       ORDER BY ui.created_at DESC`
    );
    return result.rows.map(mapRow);
  }

  async purgeExpiredWithoutUser(): Promise<number> {
    return this.purgeExpired();
  }

  private async purgeExpired(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `WITH expired AS (
         UPDATE user_invitations
         SET revoked_at = now()
         WHERE accepted_at IS NULL
           AND revoked_at IS NULL
           AND expires_at <= now()
         RETURNING id
       )
       SELECT COUNT(*)::text AS count FROM expired`
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private async revokeActiveForEmail(email: string): Promise<void> {
    await this.pool.query(
      `UPDATE user_invitations SET revoked_at = now()
       WHERE lower(invitee_email) = $1
         AND accepted_at IS NULL
         AND revoked_at IS NULL`,
      [email.trim().toLowerCase()]
    );
  }

  private async requireById(id: string): Promise<UserInvitationRecord> {
    const result = await this.pool.query<Row>(`${SELECT_INVITATION} WHERE ui.id = $1`, [id]);
    const row = result.rows[0];
    if (!row) {
      throw new Error('Missing invitation row');
    }
    return mapRow(row);
  }
}

type Row = {
  id: string;
  email: string;
  invited_name: string;
  assigned_role: string;
  invited_by_user_id: string;
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
};

function mapRow(row: Row): UserInvitationRecord {
  return {
    id: row.id,
    email: row.email,
    invitedName: row.invited_name,
    assignedRole: dbRoleToInstanceRole(
      row.assigned_role as 'installation_admin' | 'installation_member'
    ),
    invitedByUserId: row.invited_by_user_id,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}
