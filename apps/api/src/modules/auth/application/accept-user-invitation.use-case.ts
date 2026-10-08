import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import {
  AUTH_MAX_PASSWORD_LENGTH,
  AUTH_MIN_PASSWORD_LENGTH,
} from '../domain/auth-password.constants.js';
import { ValidationError } from '../../../shared/domain/errors.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { hashInvitationToken } from '../../admin/domain/user-invitation.tokens.js';
import { INSTALLATION_DB_ROLE_ADMIN } from '../domain/installation.constants.js';
import { dbRoleToInstanceRole } from '../domain/installation-authorization.js';
import { INSTANCE_ROLE_ADMIN } from '../domain/instance-role.constants.js';
import { provisionInvitedUser } from './provision-invited-user.js';

@Injectable()
export class AcceptUserInvitationUseCase {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async execute(input: { token: string; password: string }): Promise<void> {
    assertPasswordLength(input.password);
    const tokenHash = hashInvitationToken(input.token.trim());
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<{
        id: string;
        email: string;
        invited_name: string;
        assigned_role: string;
        invited_by_user_id: string;
      }>(
        `SELECT id, invitee_email AS email, invitee_name AS invited_name, assigned_role, invited_by_user_id
         FROM user_invitations
         WHERE token_hash = $1
           AND accepted_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > now()
         FOR UPDATE`,
        [tokenHash]
      );
      const row = locked.rows[0];
      if (!row) {
        throw new ValidationError('admin.errors.invitationInvalid');
      }
      const inviter = await client.query<{ role: string }>(
        `SELECT r.role
         FROM installation_user_roles r
         WHERE r.user_id = $1
           AND NOT EXISTS (
             SELECT 1 FROM installation_user_suspensions s
             WHERE s.user_id = r.user_id
               AND (s.expires_at IS NULL OR s.expires_at > now())
           )`,
        [row.invited_by_user_id]
      );
      const inviterRole = inviter.rows[0]?.role;
      if (!inviterRole) {
        throw new ValidationError('admin.errors.invitationInvalid');
      }
      const assignedRole = dbRoleToInstanceRole(
        row.assigned_role as 'installation_admin' | 'installation_member'
      );
      if (assignedRole === INSTANCE_ROLE_ADMIN && inviterRole !== INSTALLATION_DB_ROLE_ADMIN) {
        throw new ValidationError('admin.errors.invitationInvalid');
      }
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1`,
        [row.email.trim().toLowerCase()]
      );
      if (existing.rows[0]) {
        throw new ValidationError('admin.errors.invitationInvalid');
      }
      const claimed = await client.query<{ id: string }>(
        `UPDATE user_invitations
         SET accepted_at = now()
         WHERE id = $1 AND accepted_at IS NULL
         RETURNING id`,
        [row.id]
      );
      if (!claimed.rows[0]) {
        throw new ValidationError('admin.errors.invitationInvalid');
      }
      await provisionInvitedUser({
        pool: client,
        email: row.email,
        name: row.invited_name,
        role: assignedRole,
        password: input.password,
      });
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

function assertPasswordLength(password: string): void {
  if (password.length < AUTH_MIN_PASSWORD_LENGTH) {
    throw new ValidationError('Password is too short');
  }
  if (password.length > AUTH_MAX_PASSWORD_LENGTH) {
    throw new ValidationError('Password is too long');
  }
}
