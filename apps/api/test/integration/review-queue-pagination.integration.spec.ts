// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { CURSOR_LIST_DEFAULT_LIMIT } from '@docuvate/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { PgDocumentReviewQueueRepository } from '../../src/modules/documents/infrastructure/pg-document-review-queue.repository.js';
import { getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('review queue keyset pagination', () => {
  const pool = getIntegrationPool();
  const repo = new PgDocumentReviewQueueRepository(pool);
  let userId: string;

  beforeEach(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
      const now = Date.now();
      for (let i = 0; i < 4; i += 1) {
        const id = randomUUID();
        const createdAt = new Date(now - i * 60_000);
        await client.query(
          `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
           VALUES ($1, $2, $3, $4, 'ready', $5, 'application/pdf', $6, $6)`,
          [id, userId, `doc-${String(i)}.pdf`, `Doc ${String(i)}`, `storage/${id}`, createdAt]
        );
        await client.query(
          `INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
           VALUES ($1, 'suggestion:vendor', $2, 0.9)`,
          [id, `Vendor ${String(i)}`]
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
    const first = await repo.listPendingDocumentPage(userId, 2);
    expect(first.rows).toHaveLength(2);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).toBeTruthy();
    expect(first.total).toBe(4);

    const second = await repo.listPendingDocumentPage(userId, 2, first.nextCursor ?? undefined);
    expect(second.rows).toHaveLength(2);
    expect(second.hasMore).toBe(false);
    expect(second.total).toBeNull();

    const ids = [...first.rows, ...second.rows].map((row) => row.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('defaults to CURSOR_LIST_DEFAULT_LIMIT when callers pass that limit', async () => {
    const page = await repo.listPendingDocumentPage(userId, CURSOR_LIST_DEFAULT_LIMIT);
    expect(page.rows.length).toBeLessThanOrEqual(CURSOR_LIST_DEFAULT_LIMIT);
  });
});
