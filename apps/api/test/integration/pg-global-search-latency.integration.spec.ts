import { performance } from 'node:perf_hooks';

import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { queryWithWordSimilarityThreshold } from '../../src/modules/search/infrastructure/pg-trgm-query.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

const WORD_SIM_THRESHOLD = 0.45;
const DOCUMENT_COUNT = 1000;
function percentile(sortedMs: number[], p: number): number {
  const index = Math.min(sortedMs.length - 1, Math.ceil((p / 100) * sortedMs.length) - 1);
  return sortedMs[Math.max(0, index)];
}

describe('PgGlobalSearchRepository lexical latency (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let repo: PgGlobalSearchRepository;
  let userId: string;
  const sampleQueries = ['Rechnung', 'Kontoauszug', 'Quartal', 'Beratung', 'Gebühr'];

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

    for (let docIndex = 0; docIndex < DOCUMENT_COUNT; docIndex += 1) {
      const id = uuidv4();
      const title = `Dokument ${String(docIndex)} Rechnung Beratung`;
      const bodyParts = [
        `Monatliche Rechnung ${String(docIndex)} für Beratungsleistungen.`,
        `Kontoauszug und Gebühr im Quartal ${String(docIndex % 12)}.`,
        `Zusatztext Nordwind GmbH Vertrag ${String(docIndex)}.`,
      ];
      await pool.query(
        `INSERT INTO documents (
          id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'application/pdf', $5, 'ready', $6, now(), now())`,
        [id, userId, `doc-${String(docIndex)}.pdf`, title, `key/${id}`, bodyParts.join(' ')]
      );
      await repo.indexDocumentChunks(
        userId,
        id,
        splitTextChunksWithSpans(bodyParts.join('\n\n'))
      );
      if (docIndex > 0 && docIndex % 200 === 0) {
        await pool.query('ANALYZE document_text_chunks');
        await pool.query('ANALYZE documents');
      }
    }
    await pool.query('ANALYZE document_text_chunks');
    await pool.query('ANALYZE documents');
  }, 600_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('uses document_text_chunks_body_trgm_idx for chunk word similarity', async () => {
    const probe = 'rechnung';
    const explain = await queryWithWordSimilarityThreshold<{ 'QUERY PLAN': string }>(
      pool,
      WORD_SIM_THRESHOLD,
      `EXPLAIN (FORMAT TEXT)
       SELECT c.document_id, c.body
       FROM document_text_chunks c
       JOIN documents cd ON cd.id = c.document_id
       WHERE cd.user_id = $1
         AND EXISTS (
           SELECT 1
           FROM unnest($2::text[]) AS p(token)
           WHERE p.token <% c.body OR c.body %> p.token
         )
       LIMIT 32`,
      [userId, [probe]],
      { disableSeqScan: true }
    );
    const plan = explain.rows.map((row) => row['QUERY PLAN']).join('\n');
    expect(plan).toContain('document_text_chunks_body_trgm_idx');
    expect(plan).not.toMatch(/Seq Scan on document_text_chunks\b/);
  });

  it('returns no documents for nonsense queries', async () => {
    const result = await repo.search(userId, 'xyzqq', {
      includeDocuments: true,
      includeFolders: false,
      includeLabels: false,
      perGroupLimit: 20,
    });
    expect(result.documents.length).toBe(0);
  });

  it('keeps lexical search p95 under 300ms on 1k documents', async () => {
    const durationsMs: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const query = sampleQueries[i % sampleQueries.length] ?? 'Rechnung';
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
    const p95 = percentile(durationsMs, 95);
    console.info(
      `global_search_lexical_p95_ms=${p95.toFixed(1)} n=${String(durationsMs.length)} min=${durationsMs[0]?.toFixed(1)} max=${durationsMs[durationsMs.length - 1]?.toFixed(1)}`
    );
    expect(p95).toBeLessThan(300);
  });
});
