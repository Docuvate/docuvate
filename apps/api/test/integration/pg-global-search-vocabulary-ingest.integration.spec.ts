import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { refreshDocumentVocabularyTerms } from '../../src/modules/search/infrastructure/search-vocabulary-document-sync.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

async function docFrequency(
  pool: ReturnType<typeof getIntegrationPool>,
  userId: string,
  term: string
): Promise<number> {
  const row = await pool.query<{ doc_frequency: number }>(
    `SELECT doc_frequency FROM search_vocabulary_terms WHERE user_id = $1 AND term = $2`,
    [userId, term]
  );
  return row.rows[0]?.doc_frequency ?? 0;
}

describe('search_vocabulary_terms live ingest doc_frequency (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let repo: PgGlobalSearchRepository;
  let userId: string;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
    } finally {
      client.release();
    }
    repo = new PgGlobalSearchRepository(pool);
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('keeps doc_frequency unchanged when the same document is re-indexed twice', async () => {
    const uniqueTerm = `reidx${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const documentId = randomUUID();
    const body = `${uniqueTerm} Alpha text.`;
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1, $2, 'a.pdf', 'Alpha', 'application/pdf', 'k/a', 'ready', $3)`,
      [documentId, userId, body]
    );
    const chunks = splitTextChunksWithSpans(body);
    await repo.indexDocumentChunks(userId, documentId, chunks);
    const afterFirst = await docFrequency(pool, userId, uniqueTerm.toLowerCase());
    await repo.indexDocumentChunks(userId, documentId, chunks);
    const afterSecond = await docFrequency(pool, userId, uniqueTerm.toLowerCase());
    expect(afterFirst).toBe(1);
    expect(afterSecond).toBe(afterFirst);
  });

  it('decrements and removes vocabulary rows when a document is deleted', async () => {
    const uniqueTerm = `deltok${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const documentId = randomUUID();
    const body = `${uniqueTerm} Haftpflicht Nachweis.`;
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1, $2, 'del.pdf', 'Delete Me', 'application/pdf', 'k/d', 'ready', $3)`,
      [documentId, userId, body]
    );
    await repo.indexDocumentChunks(userId, documentId, splitTextChunksWithSpans(body));
    const term = uniqueTerm.toLowerCase();
    expect(await docFrequency(pool, userId, term)).toBe(1);
    await repo.releaseDocumentVocabularyForDocuments(userId, [documentId]);
    await pool.query(`DELETE FROM documents WHERE id = $1`, [documentId]);
    expect(await docFrequency(pool, userId, term)).toBe(0);
    const row = await pool.query(
      `SELECT 1 FROM search_vocabulary_terms WHERE user_id = $1 AND term = $2`,
      [userId, term]
    );
    expect(row.rows).toHaveLength(0);
  });

  it('counts parallel ingestion of N documents with a shared term exactly once each', async () => {
    const sharedTerm = `parterm${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const documentIds: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const documentId = randomUUID();
      documentIds.push(documentId);
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
         VALUES ($1, $2, $3, 'Parallel', 'application/pdf', $4, 'ready', $5)`,
        [documentId, userId, `p-${String(i)}.pdf`, `k/p-${String(i)}`, `${sharedTerm} body text.`]
      );
    }
    await Promise.all(
      documentIds.map((documentId) =>
        repo.indexDocumentChunks(
          userId,
          documentId,
          splitTextChunksWithSpans(`${sharedTerm} body text.`)
        )
      )
    );
    expect(await docFrequency(pool, userId, sharedTerm.toLowerCase())).toBe(documentIds.length);
    for (const documentId of documentIds) {
      const junction = await pool.query(
        `SELECT 1 FROM search_vocabulary_document_terms WHERE document_id = $1 AND term = $2`,
        [documentId, sharedTerm.toLowerCase()]
      );
      expect(junction.rows).toHaveLength(1);
    }
  });

  it('refreshDocumentVocabularyTerms is idempotent when called twice', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1, $2, 'idempotent.pdf', 'Idempotent', 'application/pdf', 'k/i', 'ready', 'Quartal Bericht.')`,
      [documentId, userId]
    );
    await repo.indexDocumentChunks(
      userId,
      documentId,
      splitTextChunksWithSpans('Quartal Bericht.')
    );
    const first = await docFrequency(pool, userId, 'quartal');
    await refreshDocumentVocabularyTerms(pool, userId, documentId);
    const second = await docFrequency(pool, userId, 'quartal');
    expect(second).toBe(first);
  });
});
