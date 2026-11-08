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

  it('counts an open suggestion below 0.85', async () => {
    const client = await pool.connect();
    const lowId = randomUUID();
    try {
      const createdAt = new Date();
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
         VALUES ($1, $2, 'low.pdf', 'Low', 'ready', $3, 'application/pdf', $4, $4)`,
        [lowId, userId, `storage/${lowId}`, createdAt]
      );
      await client.query(
        `INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
         VALUES ($1, 'suggestion:vendor', 'ACME GmbH', 0.55)`,
        [lowId]
      );
      expect(await repo.countPendingDocuments(userId)).toBe(5);
      const ids = (await repo.listPendingDocumentPage(userId, 20)).rows.map((row) => row.id);
      expect(ids).toContain(lowId);
    } finally {
      client.release();
    }
  });

  it('defaults to CURSOR_LIST_DEFAULT_LIMIT when callers pass that limit', async () => {
    const page = await repo.listPendingDocumentPage(userId, CURSOR_LIST_DEFAULT_LIMIT);
    expect(page.rows.length).toBeLessThanOrEqual(CURSOR_LIST_DEFAULT_LIMIT);
  });

  it('drops a document whose only suggestion was rejected and keeps a different field', async () => {
    const client = await pool.connect();
    const rejectedId = randomUUID();
    const keptId = randomUUID();
    const otherUserId = newIsolationUserId();
    try {
      const other = buildSyntheticUser({ id: otherUserId });
      await insertSyntheticUser(client, other);
      const createdAt = new Date();
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
         VALUES ($1, $2, 'rejected.pdf', 'Rejected', 'ready', $3, 'application/pdf', $4, $4),
                ($5, $2, 'kept.pdf', 'Kept', 'ready', $6, 'application/pdf', $4, $4)`,
        [rejectedId, userId, `storage/${rejectedId}`, createdAt, keptId, `storage/${keptId}`]
      );
      await client.query(
        `INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
         VALUES ($1, 'suggestion:vendor', 'ACME GmbH', 0.95),
                ($2, 'suggestion:vendor', 'ACME GmbH', 0.95),
                ($2, 'suggestion:amount', '12,00', 0.95)`,
        [rejectedId, keptId]
      );
      const correctionId = randomUUID();
      await client.query(
        `INSERT INTO corrections (id, user_id, document_id, kind, created_by, status)
         VALUES ($1, $2, $3, 'field', $2, 'active')`,
        [correctionId, userId, rejectedId]
      );
      await client.query(
        `INSERT INTO document_field_suggestion_decisions
           (id, document_id, user_id, field_key, value_raw, value_normalized, decision, correction_id)
         VALUES ($1, $2, $3, 'vendor', 'ACME GmbH', 'acme gmbh', 'rejected', $4)`,
        [randomUUID(), rejectedId, userId, correctionId]
      );
      const amountOnly = randomUUID();
      await client.query(
        `INSERT INTO corrections (id, user_id, document_id, kind, created_by, status)
         VALUES ($1, $2, $3, 'field', $2, 'active')`,
        [amountOnly, userId, keptId]
      );
      await client.query(
        `INSERT INTO document_field_suggestion_decisions
           (id, document_id, user_id, field_key, value_raw, value_normalized, decision, correction_id)
         VALUES ($1, $2, $3, 'global:vendor', 'ACME GmbH', 'acme gmbh', 'rejected', $4)`,
        [randomUUID(), keptId, userId, amountOnly]
      );

      const pending = await repo.listPendingDocumentPage(userId, 20);
      const ids = pending.rows.map((row) => row.id);
      expect(ids).not.toContain(rejectedId);
      expect(ids).toContain(keptId);
      expect(await repo.countPendingDocuments(userId)).toBe(5);

      await client.query(
        `UPDATE document_field_values SET value_text = '  ACME   GmbH ' WHERE document_id = $1`,
        [rejectedId]
      );
      expect((await repo.listPendingDocumentPage(userId, 20)).rows.map((row) => row.id)).not.toContain(
        rejectedId
      );

      await client.query(
        `UPDATE document_field_suggestion_decisions SET withdrawn_at = now() WHERE document_id = $1`,
        [rejectedId]
      );
      expect((await repo.listPendingDocumentPage(userId, 20)).rows.map((row) => row.id)).toContain(
        rejectedId
      );

      const otherDoc = randomUUID();
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
         VALUES ($1, $2, 'other.pdf', 'Other', 'ready', $3, 'application/pdf', $4, $4)`,
        [otherDoc, otherUserId, `storage/${otherDoc}`, createdAt]
      );
      await client.query(
        `INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
         VALUES ($1, 'suggestion:vendor', 'Other GmbH', 0.95)`,
        [otherDoc]
      );
      const isolated = await repo.countPendingDocuments(userId);
      const withOther = await repo.countPendingDocuments(otherUserId);
      expect(withOther).toBe(1);
      expect(isolated).toBe((await repo.listPendingDocumentPage(userId, 50)).rows.length);
    } finally {
      client.release();
      await deleteSyntheticUser(pool, otherUserId);
    }
  });
});
