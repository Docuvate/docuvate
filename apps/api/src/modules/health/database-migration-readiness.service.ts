// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';
import type pg from 'pg';

import { listPendingDatabaseMigrationNamesFromPool } from '../../shared/infrastructure/database/list-pending-database-migrations.js';
import { PG_POOL } from '../../shared/infrastructure/database/tokens.js';

@Injectable()
export class DatabaseMigrationReadinessService {
  private readonly logger = new Logger(DatabaseMigrationReadinessService.name);

  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listPendingMigrationNames(): Promise<string[]> {
    return listPendingDatabaseMigrationNamesFromPool(this.pool);
  }

  logPendingMigrationsAtStartup(pending: readonly string[]): void {
    if (pending.length === 0) {
      return;
    }
    this.logger.error(
      `Database schema is behind: ${String(pending.length)} pending migration(s): ${pending.join(', ')}`
    );
  }
}
