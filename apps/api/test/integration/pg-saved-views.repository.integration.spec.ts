import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { assertCanReadView } from '../../src/modules/workspace/domain/saved-view-access.js';
import { PgWorkspaceRepository } from '../../src/modules/workspace/infrastructure/pg-workspace.repository.js';
import { ForbiddenError } from '../../src/shared/domain/errors.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('PgWorkspaceRepository saved views (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const repo = new PgWorkspaceRepository(pool);
  let ownerId: string;
  let otherId: string;

  beforeEach(async () => {
    ownerId = newIsolationUserId();
    otherId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, buildSyntheticUser({ id: ownerId }));
      await insertSyntheticUser(client, buildSyntheticUser({ id: otherId }));
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, ownerId);
    await deleteSyntheticUser(pool, otherId);
  });

  it('scopes private views to the owner in list results', async () => {
    const id = randomUUID();
    await repo.createView(id, ownerId, { name: 'Private', searchQuery: '', inbox: true }, 0);
    const ownerList = await repo.listViewsVisibleToUser(ownerId);
    expect(ownerList.some((v) => v.id === id)).toBe(true);
    const otherList = await repo.listViewsVisibleToUser(otherId);
    expect(otherList.some((v) => v.id === id)).toBe(false);
    const loaded = await repo.findViewById(id);
    expect(loaded).not.toBeNull();
    if (!loaded) {
      throw new Error('expected saved view');
    }
    expect(() => {
      assertCanReadView(otherId, loaded);
    }).toThrow(ForbiddenError);
  });

  it('lists shared views for all users', async () => {
    const id = randomUUID();
    await repo.createView(
      id,
      ownerId,
      { name: 'Shared', searchQuery: '', visibility: 'shared' },
      0
    );
    const otherList = await repo.listViewsVisibleToUser(otherId);
    expect(otherList.some((v) => v.id === id)).toBe(true);
  });
});

afterAll(async () => {
  await closeIntegrationPool();
});
