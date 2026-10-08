import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PgDocumentChatThreadRepository } from '../../src/modules/documents/infrastructure/pg-document-chat-thread.repository.js';
import { PgDuplicateStackRepository } from '../../src/modules/duplicates/infrastructure/pg-duplicate-stack.repository.js';
import { PgLabelEmbeddingRepository } from '../../src/modules/labels/infrastructure/pg-label-embedding.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

/** Child tables without user_id are scoped through their parent rows (ADR 015). */
describe('junction ownership via parent joins (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userA: string;
  let userB: string;
  const docA = randomUUID();
  const tagA = randomUUID();
  const threadId = randomUUID();

  beforeAll(async () => {
    userA = newIsolationUserId();
    userB = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userA, name: 'A', email: `${userA}@example.test` });
      await insertSyntheticUser(client, { id: userB, name: 'B', email: `${userB}@example.test` });
    } finally {
      client.release();
    }
    await pool.query(`INSERT INTO tags (id, user_id, name) VALUES ($1, $2, 'T')`, [tagA, userA]);
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'a.pdf', 'application/pdf', 'k', 'ready')`,
      [docA, userA]
    );
    await pool.query(
      `INSERT INTO document_embeddings (document_id, model, embedding) VALUES ($1, 'm', $2::jsonb)`,
      [docA, JSON.stringify([0.1, 0.2])]
    );
    await pool.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [docA, tagA]);
    await pool.query(
      `INSERT INTO tag_embedding_centroids (tag_id, model, sample_count, centroid)
       VALUES ($1, 'm', 3, $2::jsonb)`,
      [tagA, JSON.stringify([0.2, 0.3])]
    );
    const stack = await pool.query<{ id: string }>(
      `INSERT INTO document_duplicate_stacks (user_id) VALUES ($1) RETURNING id`,
      [userA]
    );
    await pool.query(
      `INSERT INTO document_stack_members (stack_id, document_id, role) VALUES ($1, $2, 'primary')`,
      [stack.rows[0]!.id, docA]
    );
    await pool.query(
      `INSERT INTO chat_threads (id, user_id, title, scope) VALUES ($1, $2, 'x', 'document')`,
      [threadId, userA]
    );
    await pool.query(
      `INSERT INTO chat_thread_documents (thread_id, document_id) VALUES ($1, $2)`,
      [threadId, docA]
    );
    await new PgGlobalSearchRepository(pool).indexDocumentChunks(
      userA,
      docA,
      'Vertrauliche Vereinbarung zwischen den Parteien.'
    );
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userA);
    await deleteSyntheticUser(pool, userB);
    await closeIntegrationPool();
  });

  it('hides embeddings, stacks, chat links and centroids from other users', async () => {
    const embeddings = new PgLabelEmbeddingRepository(pool);
    const stacks = new PgDuplicateStackRepository(pool);
    const chat = new PgDocumentChatThreadRepository(pool);

    expect(await embeddings.getDocumentEmbedding(docA)).not.toBeNull();
    expect(await embeddings.listDocumentEmbeddingsForUser(userB)).toHaveLength(0);
    expect(await stacks.getMembership(docA, userB)).toBeNull();
    expect(await chat.listThreadsForDocument(docA, userB)).toHaveLength(0);

    const centroids = await embeddings.getTagCentroids(userA);
    expect(centroids.find((c) => c.tagId === tagA)?.sampleCount).toBe(3);
    expect(await embeddings.getTagCentroids(userB)).toHaveLength(0);
  });

  it('scopes text chunks and embeddings in global search to the owner', async () => {
    const search = new PgGlobalSearchRepository(pool);
    expect(await search.userHasDocumentEmbeddings(userA)).toBe(true);
    expect(await search.userHasDocumentEmbeddings(userB)).toBe(false);

    const own = await search.search(userA, 'Vereinbarung', { includeDocuments: true });
    expect(own.documents.map((d) => d.id)).toContain(docA);
    const foreign = await search.search(userB, 'Vereinbarung', { includeDocuments: true });
    expect(foreign.documents.map((d) => d.id)).not.toContain(docA);
  });
});
