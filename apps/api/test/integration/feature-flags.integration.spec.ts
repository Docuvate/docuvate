import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ResolveFeatureFlagsUseCase } from '../../src/modules/feature-flags/application/resolve-feature-flags.use-case.js';
import { FEATURE_FLAG_DB_KEYS } from '../../src/modules/feature-flags/domain/feature-flag-keys.js';
import { PgFeatureFlagRepository } from '../../src/modules/feature-flags/infrastructure/pg-feature-flag.repository.js';
import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('feature flags (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const repository = new PgFeatureFlagRepository(pool);
  const resolve = new ResolveFeatureFlagsUseCase(repository);
  let userA: string;
  let userB: string;

  const originalSource = process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'];

  beforeAll(async () => {
    userA = newIsolationUserId();
    userB = newIsolationUserId();
    process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = undefined;
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userA, name: 'A', email: `${userA}@example.test` });
      await insertSyntheticUser(client, { id: userB, name: 'B', email: `${userB}@example.test` });
    } finally {
      client.release();
    }
    await repository.upsertOverride(userA, FEATURE_FLAG_DB_KEYS.sourceConnectors, true);
  }, 60_000);

  afterAll(async () => {
    if (originalSource === undefined) {
      process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = undefined;
    } else {
      process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = originalSource;
    }
    await deleteSyntheticUser(pool, userA);
    await deleteSyntheticUser(pool, userB);
    await closeIntegrationPool();
  });

  it('applies tenant override over installation default', async () => {
    const flagsA = await resolve.execute(userA);
    expect(flagsA.sourceConnectors).toBe(true);
    const flagsB = await resolve.execute(userB);
    expect(flagsB.sourceConnectors).toBe(false);
  });

  it('isolates override rows between tenants', async () => {
    const rowsB = await withTenantPgClient(pool, userB, async (client) => {
      const result = await client.query<{ flag_key: string }>(
        `SELECT flag_key FROM feature_flag WHERE tenant_id = $1`,
        [userB]
      );
      return result.rows;
    });
    expect(rowsB).toEqual([]);

    const rowsA = await withTenantPgClient(pool, userA, async (client) => {
      const result = await client.query<{ flag_key: string; enabled: boolean }>(
        `SELECT flag_key, enabled FROM feature_flag WHERE tenant_id = $1`,
        [userA]
      );
      return result.rows;
    });
    expect(rowsA).toEqual([{ flag_key: FEATURE_FLAG_DB_KEYS.sourceConnectors, enabled: true }]);
  });
});
