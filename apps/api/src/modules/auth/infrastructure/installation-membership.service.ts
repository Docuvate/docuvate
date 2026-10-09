// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type pg from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  INSTALLATION_DB_ROLE_MEMBER,
  type InstallationDbRole,
} from '../domain/installation.constants.js';
import { dbRoleToInstanceRole } from '../domain/installation-authorization.js';

export type InstallationMembership = {
  userId: string;
  dbRole: InstallationDbRole;
  suspended: boolean;
  suspensionReason: string | null;
};

@Injectable()
export class InstallationMembershipService {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async loadForUser(userId: string): Promise<InstallationMembership> {
    const result = await this.pool.query<{
      role: InstallationDbRole | null;
      reason: string | null;
      suspended: boolean;
    }>(
      `SELECT r.role,
              s.reason,
              EXISTS (
                SELECT 1 FROM installation_user_suspensions sx
                WHERE sx.user_id = u.id
                  AND (sx.expires_at IS NULL OR sx.expires_at > now())
              ) AS suspended
       FROM "user" u
       LEFT JOIN installation_user_roles r ON r.user_id = u.id
       LEFT JOIN installation_user_suspensions s ON s.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new UnauthorizedException('Not authenticated');
    }
    return {
      userId,
      dbRole: row.role ?? INSTALLATION_DB_ROLE_MEMBER,
      suspended: row.suspended,
      suspensionReason: row.reason,
    };
  }

  instanceRoleFor(membership: InstallationMembership) {
    return dbRoleToInstanceRole(membership.dbRole);
  }
}
