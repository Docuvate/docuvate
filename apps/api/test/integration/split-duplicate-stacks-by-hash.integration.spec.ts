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
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
  }, 120_000);

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await closeIntegrationPool();
  });

  async function withIsolatedUser(run: (userId: string) => Promise<void>): Promise<void> {
    const userId = newIsolationUserId();
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
    try {
      await run(userId);
    } finally {
      await deleteSyntheticUser(pool, userId);
    }
  }

  async function runMigration(): Promise<void> {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await new SplitDuplicateStacksByContentHash20261014160000().up(runner);
    } finally {
      await runner.release();
    }
  }

  it('splits mixed-hash stacks and un-stacks singletons without deleting documents', async () => {
    await withIsolatedUser(async (userId) => {
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
      { id: docA1, hash: hashA, file: 'a1.pdf', createdAt: '2024-01-01', role: 'version' },
      { id: docA2, hash: hashA, file: 'a2.pdf', createdAt: '2025-06-01', role: 'version' },
      { id: docB1, hash: hashB, file: 'b1.pdf', createdAt: '2024-02-01', role: 'version' },
      { id: docSingle, hash: 'hash-c', file: 'c1.pdf', createdAt: '2024-03-01', role: 'version' },
    ];
    for (const doc of docs) {
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, content_hash, created_at)
         VALUES ($1,$2,$3,$3,'application/pdf',$4,'ready',$5,$6::timestamptz)`,
        [doc.id, userId, doc.file, `k/${doc.file}`, doc.hash, doc.createdAt]
      );
      await pool.query(
        `INSERT INTO document_stack_members (stack_id, document_id, role)
         VALUES ($1,$2,$3)`,
        [stackId, doc.id, doc.role]
      );
    }

    await runMigration();

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
    expect(byDoc.get(docA2)?.role).toBe('primary');

    const docCount = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM documents WHERE user_id = $1`,
      [userId]
    );
    expect(docCount.rows[0]?.n).toBe(4);
    });
  });

  it('re-elects primary when the current primary is not the newest member (same hash)', async () => {
    await withIsolatedUser(async (userId) => {
    const stackId = randomUUID();
    const hash = 'hash-same';
    const olderId = randomUUID();
    const newerId = randomUUID();

    await pool.query(
      `INSERT INTO document_duplicate_stacks (id, user_id, updated_at) VALUES ($1,$2,now())`,
      [stackId, userId]
    );
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, content_hash, created_at)
       VALUES ($1,$2,'old.pdf','old','application/pdf','k/o','ready',$3,'2023-01-01'::timestamptz),
              ($4,$2,'new.pdf','new','application/pdf','k/n','ready',$3,'2026-01-01'::timestamptz)`,
      [olderId, userId, hash, newerId]
    );
    await pool.query(
      `INSERT INTO document_stack_members (stack_id, document_id, role)
       VALUES ($1,$2,'primary'), ($1,$3,'version')`,
      [stackId, olderId, newerId]
    );

    await runMigration();

    const roles = await pool.query<{ document_id: string; role: string }>(
      `SELECT m.document_id, m.role
       FROM document_stack_members m
       JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE s.user_id = $1`,
      [userId]
    );
    expect(roles.rows).toHaveLength(2);
    const byId = new Map(roles.rows.map((row) => [row.document_id, row.role]));
    expect(byId.get(newerId)).toBe('primary');
    expect(byId.get(olderId)).toBe('version');
    });
  });

  it('elects a primary when the stack has no primary row', async () => {
    await withIsolatedUser(async (userId) => {
    const stackId = randomUUID();
    const hash = 'hash-no-primary';
    const docA = randomUUID();
    const docB = randomUUID();

    await pool.query(
      `INSERT INTO document_duplicate_stacks (id, user_id, updated_at) VALUES ($1,$2,now())`,
      [stackId, userId]
    );
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, content_hash, created_at)
       VALUES ($1,$2,'a.pdf','a','application/pdf','k/a','ready',$3,'2024-04-01'::timestamptz),
              ($4,$2,'b.pdf','b','application/pdf','k/b','ready',$3,'2024-08-01'::timestamptz)`,
      [docA, userId, hash, docB]
    );
    await pool.query(
      `INSERT INTO document_stack_members (stack_id, document_id, role)
       VALUES ($1,$2,'version'), ($1,$3,'version')`,
      [stackId, docA, docB]
    );

    await runMigration();

    const roles = await pool.query<{ role: string; document_id: string }>(
      `SELECT m.document_id, m.role
       FROM document_stack_members m
       JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE s.user_id = $1`,
      [userId]
    );
    expect(roles.rows.filter((row) => row.role === 'primary')).toHaveLength(1);
    expect(roles.rows.find((row) => row.role === 'primary')?.document_id).toBe(docB);
    });
  });

  it('un-stacks 30 members with distinct content hashes without constraint errors', async () => {
    await withIsolatedUser(async (userId) => {
    const stackId = randomUUID();
    await pool.query(
      `INSERT INTO document_duplicate_stacks (id, user_id, updated_at) VALUES ($1,$2,now())`,
      [stackId, userId]
    );

    for (let i = 0; i < 30; i += 1) {
      const docId = randomUUID();
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, content_hash, created_at)
         VALUES ($1,$2,$3,$3,'application/pdf',$4,'ready',$5,now())`,
        [docId, userId, `f-${String(i)}.pdf`, `k/${String(i)}`, `hash-distinct-${String(i)}`]
      );
      await pool.query(
        `INSERT INTO document_stack_members (stack_id, document_id, role)
         VALUES ($1,$2,'version')`,
        [stackId, docId]
      );
    }

    await runMigration();

    const members = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n
       FROM document_stack_members m
       JOIN document_duplicate_stacks s ON s.id = m.stack_id
       WHERE s.user_id = $1`,
      [userId]
    );
    expect(members.rows[0]?.n).toBe(0);

    const docCount = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM documents WHERE user_id = $1`,
      [userId]
    );
    expect(docCount.rows[0]?.n).toBe(30);
    });
  });
});
