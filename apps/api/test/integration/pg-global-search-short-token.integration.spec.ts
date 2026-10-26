import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { GlobalSearchUseCase } from '../../src/modules/search/application/global-search.use-case.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

const noopEmbedding: EmbeddingPort = {
  embedTexts(texts: string[]) {
    return Promise.resolve({ embeddings: texts.map(() => []), model: 'noop' });
  },
};

describe('Global search short tokens (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let useCase: GlobalSearchUseCase;
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
    const repo = new PgGlobalSearchRepository(pool);
    useCase = new GlobalSearchUseCase(repo, noopEmbedding);

    const docId = uuidv4();
    await pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
      ) VALUES ($1, $2, 'kfz.pdf', 'Kfz Haftpflicht', 'application/pdf', 'k/kfz', 'ready',
        'Nachweis GEZ und USt 2025.', now(), now())`,
      [docId, userId]
    );
    await repo.indexDocumentChunks(
      userId,
      docId,
      splitTextChunksWithSpans('Nachweis GEZ und USt 2025.')
    );
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  async function titles(query: string): Promise<string[]> {
    const res = await useCase.execute(userId, { q: query, types: 'documents', limit: 8 });
    const docs = res.groups.find((g) => g.type === 'documents')?.items ?? [];
    return docs.filter((i) => i.type === 'document').map((i) => i.title);
  }

  it('finds Kfz via document FTS / title despite chunk FTS min length 4', async () => {
    const found = await titles('Kfz');
    expect(found.some((t) => t.includes('Kfz'))).toBe(true);
  });

  it('finds GEZ, USt, and four-digit year tokens', async () => {
    const gezHits = await titles('GEZ');
    expect(gezHits.length).toBeGreaterThan(0);
    const ustHits = await titles('USt');
    expect(ustHits.length).toBeGreaterThan(0);
    const yearHits = await titles('2025');
    expect(yearHits.length).toBeGreaterThan(0);
  });
});
