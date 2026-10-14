// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SplitDuplicateStacksByContentHash20261014160000 } from '../../src/shared/infrastructure/database/migrations/20261014160000-split-duplicate-stacks-by-content-hash.js';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('SplitDuplicateStacksByContentHash migration (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Stack split',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
  }, 120_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await closeIntegrationPool();
  });

  it('splits mixed-hash stacks and un-stacks singletons without deleting documents', async () => {
    const stackId = randomUUID();
    const hashA = 'hash-a';
    const hashB = 'hash-b';
    const docA1 = randomUUID();
    const docA2 = randomUUID();
    const docB1 = randomUUID();
    const docSingle = randomUUID();

    await pool.query(
      `INSERT INTO document_duplicate_stacks (id, user_id, updated_at) VALUES ($1,$2,now())`,
      [stackId, userId]
    );
    const docs = [
      { id: docA1, hash: hashA, file: 'a1.pdf' },
      { id: docA2, hash: hashA, file: 'a2.pdf' },
      { id: docB1, hash: hashB, file: 'b1.pdf' },
      { id: docSingle, hash: 'hash-c', file: 'c1.pdf' },
    ];
    for (const doc of docs) {
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, content_hash)
         VALUES ($1,$2,$3,$3,'application/pdf',$4,'ready',$5)`,
        [doc.id, userId, doc.file, `k/${doc.file}`, doc.hash]
      );
      await pool.query(
        `INSERT INTO document_stack_members (stack_id, document_id, role)
         VALUES ($1,$2,'version')`,
        [stackId, doc.id]
      );
    }

    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await new SplitDuplicateStacksByContentHash20261014160000().up(runner);
    } finally {
      await runner.release();
    }

    const members = await pool.query<{ document_id: string; stack_id: string; role: string }>(
      `SELECT m.document_id, m.stack_id, m.role
       FROM document_stack_members m
       JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE s.user_id = $1
       ORDER BY m.document_id`,
      [userId]
    );
    expect(members.rows).toHaveLength(2);
    const byDoc = new Map(members.rows.map((row) => [row.document_id, row]));
    expect(byDoc.has(docSingle)).toBe(false);
    expect(byDoc.has(docB1)).toBe(false);
    expect(byDoc.get(docA1)?.stack_id).toBe(byDoc.get(docA2)?.stack_id);

    const docCount = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM documents WHERE user_id = $1`,
      [userId]
    );
    expect(docCount.rows[0]?.n).toBe(4);
  });
});
