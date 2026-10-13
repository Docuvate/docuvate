// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import AppDataSource from './data-source.js';
import { ensureMigrationBaseline } from './ensure-migration-baseline.js';

/** Apply pending TypeORM migrations. */
export async function runDatabaseMigrations(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await ensureMigrationBaseline(ds);
    await ds.runMigrations();
  } finally {
    await ds.destroy();
  }
}
