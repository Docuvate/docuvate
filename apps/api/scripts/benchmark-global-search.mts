/**
 * Seeds ~5k documents / ~20k chunks and measures search repository latency (p95).
 * Usage:
 *   DATABASE_URL=... pnpm --filter @docuvate/api build && node --import tsx apps/api/scripts/benchmark-global-search.mts
 */
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { PgGlobalSearchRepository } from '../src/modules/search/infrastructure/pg-global-search.repository.js';
import { splitTextChunks } from '../src/modules/search/domain/split-text-chunks.js';
import { runDatabaseMigrations } from '../src/shared/infrastructure/database/run-database-migrations.js';

const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgresql://docuvate:docuvate@127.0.0.1:5434/docuvate';
const USER = 'bench-global-search';
const DOC_COUNT = Number(process.env['BENCH_DOC_COUNT'] ?? 5000);
const CHUNKS_PER_DOC = 4;
const FIELD_COUNT = Number(process.env['BENCH_FIELD_COUNT'] ?? 20);

function p95(samples: number[]): number {
  const s = [...samples].sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.95)] ?? 0;
}

function fakeVector(seed: number, dim = 384): number[] {
  const v = Array.from({ length: dim }, (_, i) => Math.sin(seed * 0.01 + i * 0.13));
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

async function migrate(): Promise<void> {
  process.env['DATABASE_URL'] = DATABASE_URL;
  await runDatabaseMigrations();
}

async function seed(pool: pg.Pool, repo: PgGlobalSearchRepository): Promise<void> {
  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, 'Bench', 'bench@local', true, now(), now()) ON CONFLICT DO NOTHING`,
    [USER]
  );
  // Embeddings, chunks and field values cascade from documents.
  await pool.query('DELETE FROM documents WHERE user_id = $1', [USER]);
  await pool.query('DELETE FROM search_vocabulary_terms WHERE user_id = $1', [USER]);

  for (let i = 0; i < DOC_COUNT; i += 1) {
    const id = randomUUID();
    const title = `Synthetic neutral document ${i} Rechnung`;
    const text = `Passage about monthly billing and neutral vendor ${i}. `.repeat(12);
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'application/pdf',$5,'ready',$6, now(), now())`,
      [id, USER, `${title}.pdf`, title, `k/${id}`, text]
    );
    const chunks = splitTextChunks(text).slice(0, CHUNKS_PER_DOC);
    for (let c = 0; c < chunks.length; c += 1) {
      await pool.query(
        `INSERT INTO document_text_chunks (document_id, chunk_index, body, updated_at)
         VALUES ($1,$2,$3, now())`,
        [id, c, chunks[c]]
      );
    }
    await pool.query(
      `INSERT INTO document_embeddings (document_id, model, embedding, updated_at)
       VALUES ($1,'bench', $2::jsonb, now())`,
      [id, JSON.stringify(fakeVector(i))]
    );
    for (let f = 0; f < FIELD_COUNT; f += 1) {
      const storageKey = `global:bench_field_${f}`;
      const value = f === 0 ? `Vendor Nordwind ${i}` : `neutral value ${i}-${f}`;
      await pool.query(
        `INSERT INTO document_field_values (document_id, field_storage_key, value_text, value_text_norm)
         VALUES ($1,$2,$3,$4)`,
        [id, storageKey, value, value.toLowerCase()]
      );
    }
  }
}

async function measure(
  repo: PgGlobalSearchRepository,
  label: string,
  fn: () => Promise<unknown>
): Promise<number> {
  for (let w = 0; w < 3; w += 1) await fn();
  const samples: number[] = [];
  for (let i = 0; i < 40; i += 1) {
    const t0 = performance.now();
    await fn();
    samples.push(performance.now() - t0);
  }
  const result = Math.round(p95(samples));
  console.log(JSON.stringify({ label, p95_ms: result, samples: samples.length }));
  return result;
}

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const repo = new PgGlobalSearchRepository(pool);
  await migrate();
  if (process.env['BENCH_SKIP_SEED'] !== '1') {
    console.log('Seeding…');
    await seed(pool, repo);
  }
  const chunkCount = await pool.query(
    `SELECT count(*)::int AS n
     FROM document_text_chunks c JOIN documents d ON d.id = c.document_id
     WHERE d.user_id = $1`,
    [USER]
  );
  console.log(JSON.stringify({ documents: DOC_COUNT, chunks: chunkCount.rows[0]?.n }));

  const queryVector = fakeVector(999);
  const lexicalOnly = await measure(repo, 'lexical_search_p95', () =>
    repo.search(USER, 'rechnung', { includeDocuments: true, perGroupLimit: 8 })
  );

  process.env['GLOBAL_SEARCH_EMBED_FULL_SCAN'] = '1';
  const fullEmbed = await measure(repo, 'hybrid_full_embed_scan_p95', () =>
    repo.search(USER, 'rechnung', {
      includeDocuments: true,
      perGroupLimit: 8,
      queryVector,
      embedFullScan: true,
    })
  );

  delete process.env['GLOBAL_SEARCH_EMBED_FULL_SCAN'];
  const boundedEmbed = await measure(repo, 'hybrid_bounded_embed_p95', () =>
    repo.search(USER, 'rechnung', {
      includeDocuments: true,
      perGroupLimit: 8,
      queryVector,
      embedFullScan: false,
    })
  );

  const probe = 'rechnung';
  const explain = await pool.query(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
     SELECT d.id,
            GREATEST(
              word_similarity($2::text, d.title),
              word_similarity($2::text, d.filename),
              similarity(d.title, $2::text),
              similarity(d.filename, $2::text)
            ) AS score
     FROM documents d
     WHERE d.user_id = $1
       AND (
         $2::text <% d.title
         OR $2::text <% d.filename
         OR word_similarity($2::text, d.title) > 0.32
         OR word_similarity($2::text, d.filename) > 0.32
       )
     ORDER BY score DESC
     LIMIT 32`,
    [USER, probe]
  );
  const explainText = explain.rows.map((r) => String(r['QUERY PLAN'])).join('\n');
  const artifactDir = process.env['BENCH_ARTIFACT_DIR'] ?? join(tmpdir(), 'docuvate-benchmarks');
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(`${artifactDir}/global-search-explain-analyze.txt`, explainText);

  const fieldExplain = await pool.query(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
     SELECT v.document_id, v.field_storage_key, v.value_text,
            GREATEST(word_similarity($2::text, v.value_text_norm), word_similarity($2::text, v.value_text)) AS score
     FROM document_field_values v
     JOIN documents fd ON fd.id = v.document_id
     WHERE fd.user_id = $1
       AND v.value_text_norm IS NOT NULL
       AND ($2::text <% v.value_text_norm OR v.value_text_norm %> $2::text)
     ORDER BY score DESC
     LIMIT 32`,
    [USER, 'nordwind']
  );
  writeFileSync(
    `${artifactDir}/global-search-field-explain-analyze.txt`,
    fieldExplain.rows.map((r) => String(r['QUERY PLAN'])).join('\n')
  );

  const summary = {
    corpus_documents: DOC_COUNT,
    corpus_chunks: chunkCount.rows[0]?.n,
    lexical_search_p95_ms: lexicalOnly,
    before_full_embed_scan_p95_ms: fullEmbed,
    after_bounded_embed_p95_ms: boundedEmbed,
    baseline_multi_query_loop_p95_ms: 2027,
    target_p95_ms: 300,
    explain_analyze_path: `${artifactDir}/global-search-explain-analyze.txt`,
    field_explain_analyze_path: `${artifactDir}/global-search-field-explain-analyze.txt`,
    field_values_per_document: FIELD_COUNT,
  };
  writeFileSync(`${artifactDir}/global-search-benchmark.json`, JSON.stringify({ summary }, null, 2));
  console.log(JSON.stringify({ summary }));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
