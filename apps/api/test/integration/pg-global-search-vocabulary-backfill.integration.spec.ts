import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import {
  backfillSearchVocabularyForDocuments,
  recomputeSearchVocabularyDocFrequencyForUser,
} from '../../src/modules/search/infrastructure/search-vocabulary-backfill.js';
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

  it('counts doc_frequency as distinct documents and is idempotent across two backfill runs', async () => {
    const secondDocId = uuidv4();
    await pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
      ) VALUES ($1, $2, 'dup.pdf', 'Kfz Versicherung', 'application/pdf', 'k/dup', 'ready',
        'Police fuer Kfz und GEZ. Police fuer Kfz und GEZ.', now(), now())`,
      [secondDocId, userId]
    );
    const chunks = splitTextChunksWithSpans('Police fuer Kfz und GEZ. Police fuer Kfz und GEZ.');
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      await pool.query(
        `INSERT INTO document_text_chunks (document_id, chunk_index, body, updated_at)
         VALUES ($1, $2, $3, now())`,
        [secondDocId, i, chunk.body]
      );
    }

    const client = await pool.connect();
    try {
      await backfillSearchVocabularyForDocuments(client, [documentId, secondDocId]);
      const firstRun = await pool.query<{ term: string; doc_frequency: number }>(
        `SELECT term, doc_frequency FROM search_vocabulary_terms
         WHERE user_id = $1 AND term IN ('kfz', 'gez')
         ORDER BY term`,
        [userId]
      );
      await backfillSearchVocabularyForDocuments(client, [documentId, secondDocId]);
      const secondRun = await pool.query<{ term: string; doc_frequency: number }>(
        `SELECT term, doc_frequency FROM search_vocabulary_terms
         WHERE user_id = $1 AND term IN ('kfz', 'gez')
         ORDER BY term`,
        [userId]
      );
      expect(secondRun.rows).toEqual(firstRun.rows);
      const kfz = firstRun.rows.find((row) => row.term === 'kfz');
      expect(kfz?.doc_frequency).toBe(2);
      const gez = firstRun.rows.find((row) => row.term === 'gez');
      expect(gez?.doc_frequency).toBe(2);
    } finally {
      client.release();
    }
  });

  it('deletes vocabulary terms with no document occurrences on recompute', async () => {
    await pool.query(
      `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
       VALUES ($1, 'stalelegacyterm', 'chunk', 9999, now())
       ON CONFLICT (user_id, term) DO UPDATE SET doc_frequency = 9999`,
      [userId]
    );
    const client = await pool.connect();
    try {
      await recomputeSearchVocabularyDocFrequencyForUser(client, userId);
    } finally {
      client.release();
    }
    const stale = await pool.query<{ term: string }>(
      `SELECT term FROM search_vocabulary_terms WHERE user_id = $1 AND term = 'stalelegacyterm'`,
      [userId]
    );
    expect(stale.rows).toHaveLength(0);
  });
});
