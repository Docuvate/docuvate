// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import AppDataSource from './data-source.js';

/** Apply pending TypeORM migrations. */
export async function runDatabaseMigrations(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await ds.runMigrations();
  } finally {
    await ds.destroy();
  }
}
