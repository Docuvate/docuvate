// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DatabaseMigrationReadinessService {
  private readonly logger = new Logger(DatabaseMigrationReadinessService.name);

  async listPendingMigrationNames(): Promise<string[]> {
    const { listPendingDatabaseMigrationNames } =
      await import('../../shared/infrastructure/database/list-pending-database-migrations.js');
    return listPendingDatabaseMigrationNames();
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
