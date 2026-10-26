// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { GetLabelDocumentInventoryUseCase } from '../../src/modules/labels/application/get-label-document-inventory.use-case.js';
import { PgLabelDocumentInventoryRepository } from '../../src/modules/labels/infrastructure/pg-label-document-inventory.repository.js';
import { getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('label document inventory summary', () => {
  const pool = getIntegrationPool();
  const useCase = new GetLabelDocumentInventoryUseCase(new PgLabelDocumentInventoryRepository(pool));
  let userId: string;
  let tagId: string;

  beforeEach(async () => {
    userId = newIsolationUserId();
    tagId = randomUUID();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
      await client.query(
        `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm)
         VALUES ($1, $2, 'Finance', '#336699', false, 'none')`,
        [tagId, userId]
      );
      for (let i = 0; i < 3; i += 1) {
        const id = randomUUID();
        await client.query(
          `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
           VALUES ($1, $2, $3, $4, 'ready', $5, 'application/pdf', now(), now())`,
          [id, userId, `doc-${String(i)}.pdf`, `Doc ${String(i)}`, `storage/${id}`]
        );
        if (i < 2) {
          await client.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [
            id,
            tagId,
          ]);
        }
      }
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, userId);
  });

  it('returns SQL aggregates on the summary endpoint', async () => {
    const summary = await useCase.executeSummary(userId);
    expect(summary.inventory.total).toBe(3);
    expect(summary.inventory.labeled).toBe(2);
    expect(summary.inventory.unlabeled).toBe(1);
    expect(summary.documentCountByTagId[tagId]).toBe(2);
  });

  it('paginates documents on the inventory endpoint', async () => {
    const first = await useCase.execute(userId, { limit: 2 });
    expect(first.documents).toHaveLength(2);
    expect(first.total).toBe(3);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).toBeTruthy();

    const second = await useCase.execute(userId, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.documents).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });
});
