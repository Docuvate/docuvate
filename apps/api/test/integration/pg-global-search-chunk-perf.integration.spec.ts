import { performance } from 'node:perf_hooks';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { CHUNK_FTS_LATERAL_SQL } from '../../src/modules/search/infrastructure/global-search-chunk-fts.query.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { queryWithWordSimilarityThreshold } from '../../src/modules/search/infrastructure/pg-trgm-query.js';
import {
  GLOBAL_SEARCH_PERF_CHUNK_COUNT,
  seedGlobalSearchChunkPerfFixture,
} from './helpers/seed-global-search-chunk-perf.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

function percentile(sortedMs: number[], p: number): number {
  const index = Math.min(sortedMs.length - 1, Math.ceil((p / 100) * sortedMs.length) - 1);
  return sortedMs[Math.max(0, index)];
}

/** Rare tokens seeded in ~0.2% of chunks so GIN probes stay selective at 500k rows. */
const SAMPLE_QUERIES = [
  'zypperf42',
  'zypperf17',
  'zypperf99',
  'zypperf03',
  'zypperf55',
  'zypperf88',
  'zypperf12',
  'zypperf61',
];

describe('PgGlobalSearchRepository chunk FTS perf fixture (Testcontainers Postgres)', () => {
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
    await seedGlobalSearchChunkPerfFixture(pool, userId);
    const count = await pool.query<{ n: string }>(
      `SELECT count(*)::text AS n
       FROM document_text_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.user_id = $1`,
      [userId]
    );
    const n = Number.parseInt(count.rows[0]?.n ?? '0', 10);
    expect(n).toBeGreaterThanOrEqual(GLOBAL_SEARCH_PERF_CHUNK_COUNT);
  }, 900_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('chunk FTS lateral SQL uses GIN on search_vector (no seq scan on chunks)', async () => {
    const terms = ['rechnung', 'beratung'];
    const explain = await queryWithWordSimilarityThreshold<{ 'QUERY PLAN': string }>(
      pool,
      0.45,
      `EXPLAIN (FORMAT TEXT) ${CHUNK_FTS_LATERAL_SQL}`,
      [userId, terms],
      { disableSeqScan: true }
    );
    const plan = explain.rows.map((row) => row['QUERY PLAN']).join('\n');
    expect(plan).toContain('document_text_chunks_search_idx');
    expect(plan).not.toMatch(/Seq Scan on document_text_chunks\b/);
  });

  it('glued rechnungversicherung does not match without vocabulary compound', async () => {
    const withoutVocab = await repo.search(userId, 'rechnungversicherung', {
      includeDocuments: true,
      includeFolders: false,
      includeLabels: false,
      perGroupLimit: 20,
    });
    expect(withoutVocab.documents.length).toBe(0);

    await pool.query(
      `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
       VALUES ($1, 'rechnungversicherung', 'chunk', 1, now())
       ON CONFLICT (user_id, term) DO UPDATE SET updated_at = now()`,
      [userId]
    );
    await pool.query(
      `WITH target AS (
         SELECT c.ctid
         FROM document_text_chunks c
         INNER JOIN documents d ON d.id = c.document_id
         WHERE d.user_id = $1
           AND c.chunk_index = 0
           AND d.id::text LIKE '%0'
         LIMIT 1
       )
       UPDATE document_text_chunks c
       SET body = 'Vertrag rechnungversicherung Sonderfall'
       FROM target
       WHERE c.ctid = target.ctid`,
      [userId]
    );
    const withVocab = await repo.search(userId, 'rechnungversicherung', {
      includeDocuments: true,
      includeFolders: false,
      includeLabels: false,
      perGroupLimit: 20,
    });
    expect(withVocab.documents.length).toBeGreaterThan(0);
  });

  it('reports lexical p50/p95 under 300ms on 500k chunks', async () => {
    for (let w = 0; w < 5; w += 1) {
      await repo.search(userId, SAMPLE_QUERIES[w % SAMPLE_QUERIES.length] ?? 'zypperf42', {
        includeDocuments: true,
        includeFolders: false,
        includeLabels: false,
        perGroupLimit: 8,
      });
    }
    const durationsMs: number[] = [];
    for (let i = 0; i < 44; i += 1) {
      const query = SAMPLE_QUERIES[i % SAMPLE_QUERIES.length] ?? 'Rechnung';
      const started = performance.now();
      await repo.search(userId, query, {
        includeDocuments: true,
        includeFolders: false,
        includeLabels: false,
        perGroupLimit: 8,
      });
      durationsMs.push(performance.now() - started);
    }
    durationsMs.sort((a, b) => a - b);
    const p50 = percentile(durationsMs, 50);
    const p95 = percentile(durationsMs, 95);
    console.info(
      `global_search_chunk_fixture_p50_ms=${p50.toFixed(1)} global_search_chunk_fixture_p95_ms=${p95.toFixed(1)} chunks=${String(GLOBAL_SEARCH_PERF_CHUNK_COUNT)}`
    );
    expect(p95).toBeLessThan(300);
  }, 900_000);
});
