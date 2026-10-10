// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';
import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';

describe('PgGlobalSearchRepository indexDocumentChunks concurrency (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let repo: PgGlobalSearchRepository;
  let userId: string;
  let documentId: string;

  beforeAll(async () => {
    userId = newIsolationUserId();
    documentId = randomUUID();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status, extracted_text)
       VALUES ($1, $2, 'race.pdf', 'application/pdf', 'k/race', 'ready', 'seed')`,
      [documentId, userId]
    );
    repo = new PgGlobalSearchRepository(pool);
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('serializes concurrent reindex for the same document', async () => {
    const bodies = [
      'Alpha chunk text for concurrent indexing stress.',
      'Beta chunk text for concurrent indexing stress.',
      'Gamma chunk text for concurrent indexing stress.',
    ];
    const runs = bodies.map((body, round) =>
      repo.indexDocumentChunks(userId, documentId, splitTextChunksWithSpans(`${body} round ${round}.`))
    );
    await expect(Promise.all(runs)).resolves.toBeDefined();

    const rows = await pool.query<{ chunk_index: number; body: string }>(
      `SELECT chunk_index, body FROM document_text_chunks WHERE document_id = $1 ORDER BY chunk_index`,
      [documentId]
    );
    expect(rows.rows.length).toBeGreaterThan(0);
    for (let i = 0; i < rows.rows.length; i += 1) {
      expect(rows.rows[i]!.chunk_index).toBe(i);
    }
    const distinctIndexes = new Set(rows.rows.map((r) => r.chunk_index));
    expect(distinctIndexes.size).toBe(rows.rows.length);
  });
});
