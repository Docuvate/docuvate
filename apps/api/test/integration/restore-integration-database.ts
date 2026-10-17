// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DataSource } from 'typeorm';

import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';

/** Reconcile TypeORM migration history with live schema (shared Postgres across integration files). */
export async function restoreIntegrationDatabase(): Promise<void> {
  const reset = new DataSource(buildTypeOrmOptions());
  await reset.initialize();
  try {
    await reset.query('DROP TABLE IF EXISTS migrations');
  } finally {
    await reset.destroy();
  }
  const { runDatabaseMigrations } =
    await import('../../src/shared/infrastructure/database/run-database-migrations.js');
  await runDatabaseMigrations();
}
