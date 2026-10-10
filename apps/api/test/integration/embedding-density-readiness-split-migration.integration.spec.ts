// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { getIntegrationPool } from './pg-pool.js';

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

async function undoUntilCalibrationReady(
  dataSource: DataSource,
  pool: ReturnType<typeof getIntegrationPool>
): Promise<string[]> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const columns = await userStateColumns(pool);
    if (columns.includes('calibration_ready')) {
      return columns;
    }
    await dataSource.undoLastMigration();
  }
  const columns = await userStateColumns(pool);
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
