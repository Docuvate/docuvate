// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureMigrationBaseline } from '../../src/shared/infrastructure/database/ensure-migration-baseline.js';
import { regClassExists } from '../../src/shared/infrastructure/database/migration-baseline-markers.js';
import { isRecord } from '../../src/shared/infrastructure/database/row-parse.js';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';

describe('migration baseline (existing schema, empty migration history)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.runMigrations();
    await dataSource.destroy();
    const { runDatabaseMigrations } =
      await import('../../src/shared/infrastructure/database/run-database-migrations.js');
    await runDatabaseMigrations();
  });

  it('stamps only through existing schema then applies newer migrations', async () => {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      expect(await regClassExists(runner, 'public.documents')).toBe(true);
      expect(await regClassExists(runner, 'public.document_representation')).toBe(true);

      await runner.query('DROP TABLE IF EXISTS feature_flag CASCADE');
      await runner.query(`
        ALTER TABLE user_preferences
          DROP COLUMN IF EXISTS document_chat_cloud_base_url,
          DROP COLUMN IF EXISTS document_chat_cloud_api_key_encrypted
      `);
      await runner.query('DROP TABLE IF EXISTS migrations');

      await ensureMigrationBaseline(dataSource);

      const stampedRaw: unknown = await runner.query(
        `SELECT name FROM migrations ORDER BY timestamp ASC`
      );
      const stamped = Array.isArray(stampedRaw) ? stampedRaw : [];
      expect(stamped.length).toBeGreaterThan(0);
      const names = stamped
        .map((row) => {
          if (!isRecord(row)) {
            return null;
          }
          const name = row.name;
          return typeof name === 'string' ? name : null;
        })
        .filter((name): name is string => name != null);
      expect(names.includes('FeatureFlags20261013120000')).toBe(false);
      expect(names.includes('DocumentRepresentation20261012120000')).toBe(true);

      await dataSource.runMigrations();

      expect(await regClassExists(runner, 'public.feature_flag')).toBe(true);
    } finally {
      await runner.release();
    }
  });

  it('creates migrations table when missing and documents already exist', async () => {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('DROP TABLE IF EXISTS migrations');
      await ensureMigrationBaseline(dataSource);
      expect(await regClassExists(runner, 'public.migrations')).toBe(true);
    } finally {
      await runner.release();
    }
    await dataSource.runMigrations();
  });
});
