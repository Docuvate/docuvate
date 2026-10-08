import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { TYPO_SEARCH_CORPUS, recallAtK } from '../../src/modules/search/domain/typo-corpus.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';
import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';

describe('PgGlobalSearchRepository (Testcontainers Postgres)', () => {
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

    for (const c of TYPO_SEARCH_CORPUS) {
      const id = uuidv4();
      const title = c.expectedTitleNeedle;
      await pool.query(
        `INSERT INTO documents (
          id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'application/pdf', $5, 'ready', $6, now(), now())`,
        [id, userId, `${title}.pdf`, title, `key/${id}`, `${title}. Body text for ${title}.`]
      );
      await repo.indexDocumentChunks(userId, id, `${title}. Monatliche ${title} Inhalt.`);
    }
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('typo corpus recall@5 on document titles', async () => {
    let hits = 0;
    for (const c of TYPO_SEARCH_CORPUS) {
      const result = await repo.search(userId, c.query, {
        includeDocuments: true,
        includeFolders: false,
        includeLabels: false,
        perGroupLimit: 5,
      });
      const titles = result.documents.map((d) => d.title);
      if (recallAtK(titles, c.expectedTitleNeedle, 5)) hits += 1;
    }
    const recall = hits / TYPO_SEARCH_CORPUS.length;
    // eslint-disable-next-line no-console -- benchmark artifact for PR report
    console.info(`typo_corpus_recall_at_5=${recall.toFixed(3)} n=${TYPO_SEARCH_CORPUS.length}`);
    expect(recall).toBeGreaterThanOrEqual(0.75);
  });

  it('isolates documents between two users', async () => {
    const otherUser = newIsolationUserId();
    const user = buildSyntheticUser({ id: otherUser });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
    } finally {
      client.release();
    }
    const privateId = uuidv4();
    await pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
      ) VALUES ($1, $2, 'secret.pdf', 'Geheimes Dokument Alpha', 'application/pdf', 'k', 'ready', 'geheim', now(), now())`,
      [privateId, otherUser]
    );
    const leak = await repo.search(userId, 'Geheimes Dokument Alpha', {
      includeDocuments: true,
      perGroupLimit: 5,
    });
    expect(leak.documents.some((d) => d.id === privateId)).toBe(false);
  });
});
