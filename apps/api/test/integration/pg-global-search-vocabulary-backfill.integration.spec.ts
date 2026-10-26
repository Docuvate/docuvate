import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { backfillSearchVocabularyForDocuments } from '../../src/modules/search/infrastructure/search-vocabulary-backfill.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

describe('search_vocabulary_terms batch backfill (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let documentId: string;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
    } finally {
      client.release();
    }
    documentId = uuidv4();
    await pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
      ) VALUES ($1, $2, 'kfz.pdf', 'Kfz Versicherung', 'application/pdf', 'k/kfz', 'ready',
        'Police fuer Kfz und GEZ.', now(), now())`,
      [documentId, userId]
    );
    const chunks = splitTextChunksWithSpans('Police fuer Kfz und GEZ.');
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      await pool.query(
        `INSERT INTO document_text_chunks (document_id, chunk_index, body, updated_at)
         VALUES ($1, $2, $3, now())`,
        [documentId, i, chunk.body]
      );
    }
    await pool.query(`DELETE FROM search_vocabulary_terms WHERE user_id = $1`, [userId]);
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('backfills vocabulary from chunks and metadata in one batch without requiring live search', async () => {
    const client = await pool.connect();
    try {
      await backfillSearchVocabularyForDocuments(client, [documentId]);
    } finally {
      client.release();
    }
    const terms = await pool.query<{ term: string }>(
      `SELECT term FROM search_vocabulary_terms WHERE user_id = $1 ORDER BY term`,
      [userId]
    );
    const names = terms.rows.map((row) => row.term);
    expect(names).toContain('kfz');
    expect(names).toContain('gez');
    expect(names).toContain('versicherung');
  });
});
