// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { DOCUMENT_LIST_DEFAULT_LIMIT } from '@docuvate/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('document list keyset pagination', () => {
  const pool = getIntegrationPool();
  const repo = new PgDocumentRepository(pool);
  let userId: string;

  beforeEach(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
      const now = Date.now();
      for (let i = 0; i < 5; i += 1) {
        const id = randomUUID();
        const updatedAt = new Date(now - i * 60_000);
        await client.query(
          `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
           VALUES ($1, $2, $3, $4, 'ready', $5, 'application/pdf', $6, $6)`,
          [id, userId, `doc-${String(i)}.pdf`, `Doc ${String(i)}`, `storage/${id}`, updatedAt]
        );
      }
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, userId);
  });

  it('returns pages with stable ordering and cursor', async () => {
    const first = await repo.listPageForUser(userId, { limit: 2, sort: 'updatedAt', order: 'desc' });
    expect(first.entities).toHaveLength(2);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).toBeTruthy();

    const second = await repo.listPageForUser(userId, {
      limit: 2,
      sort: 'updatedAt',
      order: 'desc',
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.entities).toHaveLength(2);
    expect(second.hasMore).toBe(true);

    const ids = [...first.entities, ...second.entities].map((d) => d.id);
    expect(new Set(ids).size).toBe(4);

    const total = await repo.countForUser(userId, {});
    expect(total).toBe(5);
  });

  it('lists all rows when limit is not set on repository filters', async () => {
    const all = await repo.listForUser(userId, {});
    expect(all).toHaveLength(5);

    const page = await repo.listPageForUser(userId, { limit: DOCUMENT_LIST_DEFAULT_LIMIT });
    expect(page.entities.length).toBeLessThanOrEqual(DOCUMENT_LIST_DEFAULT_LIMIT);
  });
});
