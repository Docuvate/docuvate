// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DataSource, MigrationInterface } from 'typeorm';

import { migrationSchemaPresent, regClassExists } from './migration-baseline-markers.js';
import { isRecord } from './row-parse.js';
import { buildTypeOrmOptions } from './typeorm-options.js';

function migrationCount(rows: unknown): number {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }
  const row: unknown = rows[0];
  if (!isRecord(row)) {
    return 0;
  }
  const raw = row.c;
  if (typeof raw === 'string') {
    return Number.parseInt(raw, 10);
  }
  if (typeof raw === 'number') {
    return raw;
  }
  return 0;
}

function migrationTimestampFromName(name: string): number {
  const match = /(\d{14})$/.exec(name);
  if (!match) {
    throw new Error(`Cannot parse migration timestamp from name: ${name}`);
  }
  return Number.parseInt(match[1], 10);
}

function isMigrationCtor(value: unknown): value is new () => MigrationInterface {
  return typeof value === 'function';
}

async function ensureMigrationsTable(runner: ReturnType<DataSource['createQueryRunner']>): Promise<void> {
  await runner.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      timestamp bigint NOT NULL,
      name character varying NOT NULL
    )
  `);
}

/** Stamp only migrations whose schema is already present (legacy DBs with empty/missing migration history). */
export async function ensureMigrationBaseline(dataSource: DataSource): Promise<void> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    if (!(await regClassExists(runner, 'public.documents'))) {
      return;
    }

    await ensureMigrationsTable(runner);

    const applied: unknown = await runner.query(`SELECT COUNT(*)::text AS c FROM migrations`);
    const appliedCount = migrationCount(applied);
    if (appliedCount > 0) {
      return;
    }

    const opts = buildTypeOrmOptions();
    const migrationsRaw = opts.migrations;
    const migrations = Array.isArray(migrationsRaw) ? migrationsRaw : [];

    for (const migrationCtor of migrations) {
      if (!isMigrationCtor(migrationCtor)) {
        continue;
      }
      const instance = new migrationCtor();
      const name = instance.name;
      if (!name) {
        continue;
      }
      const present = await migrationSchemaPresent(runner, name);
      if (!present) {
        break;
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
