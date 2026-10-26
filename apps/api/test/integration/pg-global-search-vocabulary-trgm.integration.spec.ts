import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { VOCABULARY_STRICT_TRGM_SQL } from '../../src/modules/search/infrastructure/global-search-vocabulary.query.js';
import { queryWithWordSimilarityThreshold } from '../../src/modules/search/infrastructure/pg-trgm-query.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

const VOCABULARY_ROW_TARGET = 100_000;

describe('search_vocabulary_terms strict trgm lookup (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
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

    await pool.query(
      `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
       SELECT $1::text,
              'vocab' || gs::text,
              'chunk',
              1,
              now()
       FROM generate_series(1, $2::int) AS gs`,
      [userId, VOCABULARY_ROW_TARGET]
    );
    await pool.query(
      `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
       VALUES ($1, 'rechnung', 'chunk', 50, now())
       ON CONFLICT (user_id, term) DO UPDATE SET doc_frequency = EXCLUDED.doc_frequency`,
      [userId]
    );
    await pool.query('ANALYZE search_vocabulary_terms');
  }, 600_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('uses GIN trigram index for strict vocabulary lookup at 100k+ rows', async () => {
    const explain = await queryWithWordSimilarityThreshold<{ 'QUERY PLAN': string }>(
      pool,
      0.45,
      `EXPLAIN (ANALYZE, FORMAT TEXT) ${VOCABULARY_STRICT_TRGM_SQL}`,
      [userId, 'rechnug', 6],
      { strictWordSimilarityThreshold: 0.45, disableSeqScan: true }
    );
    const plan = explain.rows.map((row) => row['QUERY PLAN']).join('\n');
    expect(plan).toContain('search_vocabulary_terms_trgm_idx');
    expect(plan).not.toMatch(/Parallel Seq Scan on search_vocabulary_terms\b/);
    expect(plan).not.toMatch(/Seq Scan on search_vocabulary_terms\b/);
  });
});
