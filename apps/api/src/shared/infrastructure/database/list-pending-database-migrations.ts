// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import pg from 'pg';
import type { MigrationInterface } from 'typeorm';

import { buildTypeOrmOptions } from './typeorm-options.js';

function isMigrationCtor(value: unknown): value is new () => MigrationInterface {
  return typeof value === 'function';
}

function registeredTypeOrmMigrationNames(): string[] {
  const opts = buildTypeOrmOptions();
  const migrationsRaw = opts.migrations;
  const migrations = Array.isArray(migrationsRaw) ? migrationsRaw : [];
  const names: string[] = [];
  for (const migrationCtor of migrations) {
    if (!isMigrationCtor(migrationCtor)) {
      continue;
    }
    const instance = new migrationCtor();
    if (instance.name) {
      names.push(instance.name);
    }
  }
  return names;
}

/** Read-only pending migration check for health/readiness (pooled connection, statement timeout). */
export async function listPendingDatabaseMigrationNamesFromPool(
  pool: pg.Pool
): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query(`SET LOCAL statement_timeout = '2000'`);
    const tableCheck = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'migrations'
       ) AS exists`
    );
    if (!tableCheck.rows[0]?.exists) {
      return registeredTypeOrmMigrationNames();
    }
    const applied = await client.query<{ name: string }>(`SELECT name FROM migrations`);
    const appliedSet = new Set(applied.rows.map((row) => row.name));
    return registeredTypeOrmMigrationNames().filter((name) => !appliedSet.has(name));
  } finally {
    client.release();
  }
}

/** Names of TypeORM migrations registered in the app but not yet applied to the database. */
export async function listPendingDatabaseMigrationNames(): Promise<string[]> {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  try {
    return await listPendingDatabaseMigrationNamesFromPool(pool);
  } finally {
    await pool.end();
  }
}
