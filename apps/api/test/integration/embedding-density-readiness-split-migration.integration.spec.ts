// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EmbeddingDensityReadinessSplit20261010140000 } from '../../src/shared/infrastructure/database/migrations/20261010140000-embedding-density-readiness-split.js';
import { isRecord } from '../../src/shared/infrastructure/database/row-parse.js';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { getIntegrationPool } from './pg-pool.js';

const READINESS_SPLIT_MIGRATION_NAME = 'EmbeddingDensityReadinessSplit20261010140000';

async function userStateColumns(pool: ReturnType<typeof getIntegrationPool>): Promise<string[]> {
  const result = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'embedding_density_user_state'
     ORDER BY column_name`
  );
  return result.rows.map((row) => row.column_name);
}

async function peelMigrationsAfterReadinessSplit(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `DELETE FROM migrations
     WHERE timestamp > (
       SELECT timestamp FROM migrations WHERE name = $1
     )`,
    [READINESS_SPLIT_MIGRATION_NAME]
  );
}

async function revertReadinessSplitMigration(dataSource: DataSource): Promise<void> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    await new EmbeddingDensityReadinessSplit20261010140000().down(runner);
    await runner.query(`DELETE FROM migrations WHERE name = $1`, [READINESS_SPLIT_MIGRATION_NAME]);
  } finally {
    await runner.release();
  }
}

/** Simulate a DB upgraded through readiness-split but not later migrations. */
async function undoUntilCalibrationReady(
  dataSource: DataSource,
  pool: ReturnType<typeof getIntegrationPool>
): Promise<string[]> {
  let columns = await userStateColumns(pool);
  if (columns.includes('calibration_ready')) {
    return columns;
  }
  expect(columns.includes('coarse_ready')).toBe(true);
  await peelMigrationsAfterReadinessSplit(dataSource);
  await revertReadinessSplitMigration(dataSource);
  columns = await userStateColumns(pool);
  expect(columns).toContain('calibration_ready');
  return columns;
}

describe('EmbeddingDensityReadinessSplit migration (Postgres upgrade)', () => {
  const pool = getIntegrationPool();
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.runMigrations();
    await dataSource.destroy();
  });

  it('upgrades from calibration_ready through down and back up', async () => {
    const columnsAfterFullMigrate = await userStateColumns(pool);
    expect(columnsAfterFullMigrate).toContain('coarse_ready');
    expect(columnsAfterFullMigrate).toContain('fine_ready_tag_ids');
    expect(columnsAfterFullMigrate).not.toContain('calibration_ready');

    const columnsAfterDown = await undoUntilCalibrationReady(dataSource, pool);
    expect(columnsAfterDown).toContain('calibration_ready');
    expect(columnsAfterDown).not.toContain('coarse_ready');
    expect(columnsAfterDown).not.toContain('fine_ready_tag_ids');

    await dataSource.runMigrations();
    const columnsAfterUp = await userStateColumns(pool);
    expect(columnsAfterUp).toContain('coarse_ready');
    expect(columnsAfterUp).toContain('fine_ready_tag_ids');

    await undoUntilCalibrationReady(dataSource, pool);
    await dataSource.runMigrations();
    const columnsAfterSecondUp = await userStateColumns(pool);
    expect(columnsAfterSecondUp).toContain('coarse_ready');
    expect(columnsAfterSecondUp).toContain('fine_ready_tag_ids');
  });
});
