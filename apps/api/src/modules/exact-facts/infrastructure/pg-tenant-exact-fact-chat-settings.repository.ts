// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

interface SettingsRow {
  match_score_threshold: number | null;
}

@Injectable()
export class PgTenantExactFactChatSettingsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async readMatchScoreThreshold(tenantId: string): Promise<number | null> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<SettingsRow>(
        `SELECT match_score_threshold
         FROM tenant_exact_fact_chat_settings
         WHERE tenant_id = $1`,
        [tenantId]
      );
      const raw = result.rows[0]?.match_score_threshold;
      if (raw == null) {
        return null;
      }
      return Number.isFinite(raw) ? raw : null;
    });
  }
}
