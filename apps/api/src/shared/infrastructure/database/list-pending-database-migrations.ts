// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MigrationExecutor } from 'typeorm';

import AppDataSource from './data-source.js';
import { ensureMigrationBaseline } from './ensure-migration-baseline.js';

/** Names of TypeORM migrations registered in the app but not yet applied to the database. */
export async function listPendingDatabaseMigrationNames(): Promise<string[]> {
  const ds = await AppDataSource.initialize();
  try {
    await ensureMigrationBaseline(ds);
    const executor = new MigrationExecutor(ds);
    const pending = await executor.getPendingMigrations();
    return pending.map((migration) => migration.name);
  } finally {
    await ds.destroy();
  }
}
