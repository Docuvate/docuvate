// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { InstallationRoleReader } from '../domain/installation-role.port.js';

const INSTALLATION_ADMIN_DB_ROLE = 'installation_admin';

@Injectable()
export class PgInstallationRoleReader implements InstallationRoleReader {
  private rolesTablePresent: boolean | null = null;

  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async isInstallationAdmin(userId: string): Promise<boolean> {
    if (!(await this.hasInstallationRolesTable())) {
      return false;
    }
    const result = await this.pool.query(
      `SELECT 1 FROM installation_user_roles
       WHERE user_id = $1 AND role = $2
       LIMIT 1`,
      [userId, INSTALLATION_ADMIN_DB_ROLE]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private async hasInstallationRolesTable(): Promise<boolean> {
    if (this.rolesTablePresent !== null) {
      return this.rolesTablePresent;
    }
    const result = await this.pool.query<{ reg: string | null }>(
      `SELECT to_regclass('public.installation_user_roles')::text AS reg`
    );
    this.rolesTablePresent = result.rows[0]?.reg != null;
    return this.rolesTablePresent;
  }
}
