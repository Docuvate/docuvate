// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DataSource, MigrationInterface } from 'typeorm';

import { buildTypeOrmOptions } from './typeorm-options.js';

function migrationTimestampFromName(name: string): number {
  const match = /(\d{14})$/.exec(name);
  if (!match) {
    throw new Error(`Cannot parse migration timestamp from name: ${name}`);
  }
  return Number.parseInt(match[1], 10);
}

/** Stamp applied migrations when the DB has schema but an empty `migrations` table. */
export async function ensureMigrationBaseline(dataSource: DataSource): Promise<void> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    const migrationsTable = await runner.query<{ reg: string | null }[]>(
      `SELECT to_regclass('public.migrations')::text AS reg`
    );
    if (!migrationsTable[0]?.reg) {
      return;
    }

    const applied = await runner.query<{ c: string }[]>(
      `SELECT COUNT(*)::text AS c FROM migrations`
    );
    const appliedCount = Number.parseInt(applied[0]?.c ?? '0', 10);
    if (appliedCount > 0) {
      return;
    }

    const core = await runner.query<{ reg: string | null }[]>(
      `SELECT to_regclass('public.documents')::text AS reg`
    );
    if (!core[0]?.reg) {
      return;
    }

    const opts = buildTypeOrmOptions();
    const migrations = opts.migrations ?? [];
    for (const migrationCtor of migrations) {
      const Ctor = migrationCtor as new () => MigrationInterface;
      const instance = new Ctor();
      const name = instance.name;
      if (!name) {
        continue;
      }
      const timestamp = migrationTimestampFromName(name);
      await runner.query(`INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`, [
        timestamp,
        name,
      ]);
    }
  } finally {
    await runner.release();
  }
}
