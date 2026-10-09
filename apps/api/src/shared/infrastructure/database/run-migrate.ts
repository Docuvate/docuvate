// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { runDatabaseMigrations } from './run-database-migrations.js';

runDatabaseMigrations().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
