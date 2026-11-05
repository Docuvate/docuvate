// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('PgTaxonomyRepository.ensureInboxTag (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const repo = new PgTaxonomyRepository(pool);
  let userId: string;

  beforeEach(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, buildSyntheticUser({ id: userId }));
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, userId);
  });

  it('returns one inbox tag when a new user uploads several files at once', async () => {
    const tags = await Promise.all(Array.from({ length: 8 }, () => repo.ensureInboxTag(userId)));
    const ids = new Set(tags.map((tag) => tag.id));
    expect(ids.size).toBe(1);
    expect(tags.every((tag) => tag.isInbox)).toBe(true);

    const rows = await pool.query(
      `SELECT count(*)::int AS n FROM tags WHERE user_id = $1 AND is_inbox = true`,
      [userId]
    );
    expect(rows.rows[0]).toEqual({ n: 1 });
  });

  it('reuses the existing inbox tag', async () => {
    const first = await repo.ensureInboxTag(userId);
    const second = await repo.ensureInboxTag(userId);
    expect(second.id).toBe(first.id);
  });
});

afterAll(async () => {
  await closeIntegrationPool();
});
