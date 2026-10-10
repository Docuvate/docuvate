import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildSyntheticUser,
  syntheticFolderName,
} from '../../../../packages/testing/src/factories/index.js';
import { PgFolderRepository } from '../../src/modules/folders/infrastructure/pg-folder.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('PgFolderRepository (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const repo = new PgFolderRepository(pool);
  let userId: string;

  beforeEach(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, userId);
  });

  it('creates and lists folders for the synthetic user', async () => {
    const name = syntheticFolderName('Archiv');
    const created = await repo.create(randomUUID(), userId, name, null, null);
    expect(created.name).toBe(name);
    expect(created.userId).toBe(userId);

    const list = await repo.listForUser(userId);
    expect(list.some((f) => f.id === created.id)).toBe(true);
  });

  it('scopes findByIdForUser to the owning user', async () => {
    const created = await repo.create(randomUUID(), userId, syntheticFolderName(), null, null);
    const otherUser = newIsolationUserId();
    const found = await repo.findByIdForUser(created.id, otherUser);
    expect(found).toBeNull();
  });
});

afterAll(async () => {
  await closeIntegrationPool();
});
