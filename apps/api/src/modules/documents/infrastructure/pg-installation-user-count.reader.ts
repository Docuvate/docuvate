// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { parseNumber, recordFromUnknown } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

@Injectable()
export class PgInstallationUserCountReader {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async countActiveUsers(): Promise<number> {
    const result = await this.pool.query(`SELECT COUNT(*)::int AS count FROM "user"`);
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return 0;
    }
    return parseNumber(row.count, 0);
  }
}
