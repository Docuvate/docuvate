// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DataSource, MigrationInterface } from 'typeorm';

import { isRecord } from './row-parse.js';
import { buildTypeOrmOptions } from './typeorm-options.js';

function migrationTimestampFromName(name: string): number {
  const match = /(\d{14})$/.exec(name);
  if (!match) {
    throw new Error(`Cannot parse migration timestamp from name: ${name}`);
  }
  return Number.parseInt(match[1], 10);
}

function queryTextCell(rows: unknown, key: string): string | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const row = rows[0];
  if (!isRecord(row)) {
    return null;
  }
  const value = row[key];
  return typeof value === 'string' ? value : null;
}

function isMigrationCtor(value: unknown): value is new () => MigrationInterface {
  return typeof value === 'function';
}

/** Stamp applied migrations when the DB has schema but an empty `migrations` table. */
export async function ensureMigrationBaseline(dataSource: DataSource): Promise<void> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    const migrationsTable: unknown = await runner.query(
      `SELECT to_regclass('public.migrations')::text AS reg`
    );
    if (!queryTextCell(migrationsTable, 'reg')) {
      return;
    }

    const applied: unknown = await runner.query(`SELECT COUNT(*)::text AS c FROM migrations`);
    const appliedCount = Number.parseInt(queryTextCell(applied, 'c') ?? '0', 10);
    if (appliedCount > 0) {
      return;
    }

    const core: unknown = await runner.query(`SELECT to_regclass('public.documents')::text AS reg`);
    if (!queryTextCell(core, 'reg')) {
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
