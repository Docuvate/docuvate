// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

@Injectable()
export class PgFeatureFlagRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listOverridesForTenant(tenantId: string): Promise<Map<string, boolean>> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{ flag_key: string; enabled: boolean }>(
        `SELECT flag_key, enabled FROM feature_flag WHERE tenant_id = $1`,
        [tenantId]
      );
      return new Map(result.rows.map((row) => [row.flag_key, row.enabled]));
    });
  }

  async upsertOverride(tenantId: string, flagKey: string, enabled: boolean): Promise<void> {
    await withTenantPgClient(this.pool, tenantId, async (client) => {
      await client.query(
        `INSERT INTO feature_flag (tenant_id, flag_key, enabled, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (tenant_id, flag_key) DO UPDATE
         SET enabled = EXCLUDED.enabled, updated_at = now()`,
        [tenantId, flagKey, enabled]
      );
    });
  }
}
