// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { WorkspaceMlSettings20261104090000 } from '../../src/shared/infrastructure/database/migrations/20261104090000-workspace-ml-settings.js';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { getIntegrationPool } from './pg-pool.js';
import { newIsolationUserId } from './pg-test-isolation.js';
import { restoreIntegrationDatabase } from './restore-integration-database.js';

const MIGRATION_NAME = 'WorkspaceMlSettings20261104090000';
const pool = getIntegrationPool();

async function preferenceColumns(): Promise<string[]> {
  const result = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'user_preferences'
       AND column_name IN ('fuzzy_duplicate_detection_enabled', 'label_field_confidence_threshold')
     ORDER BY column_name`
  );
  return result.rows.map((row) => row.column_name);
}

async function workspaceRow(): Promise<{ duplicate_detection: string; field_acceptance: string }[]> {
  const result = await pool.query<{ duplicate_detection: string; field_acceptance: string }>(
    `SELECT duplicate_detection, field_acceptance FROM workspace_ml_settings`
  );
  return result.rows;
}

async function revertMigration(dataSource: DataSource): Promise<void> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await new WorkspaceMlSettings20261104090000().down(runner);
    await runner.query(`DELETE FROM migrations WHERE name = $1`, [MIGRATION_NAME]);
  } finally {
    await runner.release();
  }
}

describe('WorkspaceMlSettings migration (Postgres upgrade)', () => {
  const adminId = newIsolationUserId();
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [adminId]);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await restoreIntegrationDatabase();
  });

  it('moves the admin choices into the workspace and back on down', async () => {
    expect(await preferenceColumns()).toEqual([]);

    await revertMigration(dataSource);
    expect(await preferenceColumns()).toEqual([
      'fuzzy_duplicate_detection_enabled',
      'label_field_confidence_threshold',
    ]);

    await pool.query(`DELETE FROM installation_user_roles`);
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, 'Admin', $2, true, now() - interval '1 day', now())`,
      [adminId, `${adminId}@example.com`]
    );
    await pool.query(
      `INSERT INTO installation_user_roles (user_id, role) VALUES ($1, 'installation_admin')`,
      [adminId]
    );
    await pool.query(
      `INSERT INTO user_preferences (
         user_id, fuzzy_duplicate_detection_enabled, label_field_confidence_threshold
       ) VALUES ($1, true, 0.8)`,
      [adminId]
    );

    await dataSource.runMigrations();
    expect(await preferenceColumns()).toEqual([]);
    expect(await workspaceRow()).toEqual([
      { duplicate_detection: 'similar', field_acceptance: 'cautious' },
    ]);

    await revertMigration(dataSource);
    const restored = await pool.query<{ fuzzy: boolean; threshold: number }>(
      `SELECT fuzzy_duplicate_detection_enabled AS fuzzy,
              label_field_confidence_threshold::float8 AS threshold
       FROM user_preferences WHERE user_id = $1`,
      [adminId]
    );
    expect(restored.rows).toEqual([{ fuzzy: true, threshold: 0.75 }]);

    await dataSource.runMigrations();
    expect(await preferenceColumns()).toEqual([]);
  });
});
