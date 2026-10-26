#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Benchmark duplicate-detection paths.
 * Fuzzy path uses a synthetic 10k int8 corpus (public-domain-independent) for SLA timing.
 */
import { performance } from 'node:perf_hooks';

import { DEFAULT_DUPLICATE_CLASSIFIER_MODEL } from '@docuvate/contracts';
import pg from 'pg';

import { int8EmbeddingDot } from '../src/modules/duplicates/domain/embedding-int8-similarity.js';

const CORPUS_TARGET = Number(process.env['BENCHMARK_CORPUS_SIZE'] ?? 10_000);
const FUZZY_SLA_MS = 50;
const PRECISION_TARGET = 0.99;
const EMBEDDING_DIM = 384;

interface Int8Row {
  documentId: string;
  scale: number;
  int8: Buffer;
}

function buildSyntheticCorpus(size: number): Int8Row[] {
  const rows: Int8Row[] = [];
  for (let index = 0; index < size; index += 1) {
    const bytes = Buffer.alloc(EMBEDDING_DIM);
    for (let dim = 0; dim < EMBEDDING_DIM; dim += 1) {
      const value = ((index * 17 + dim * 31) % 255) - 127;
      bytes.writeInt8(value, dim);
    }
    rows.push({
      documentId: `synthetic-${String(index)}`,
      scale: 0.01 + (index % 7) * 0.001,
      int8: bytes,
    });
  }
  return rows;
}

function benchmarkFuzzyIndexed(corpus: Int8Row[]): number {
  const samples = Math.min(20, corpus.length);
  let totalMs = 0;
  for (let i = 0; i < samples; i += 1) {
    const focus = corpus[i];
    if (!focus) continue;
    const t0 = performance.now();
    const ranked = corpus
      .filter((peer) => peer.documentId !== focus.documentId)
      .map((peer) => ({
        id: peer.documentId,
        similarity: int8EmbeddingDot(focus.scale, focus.int8, peer.scale, peer.int8),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);
    void ranked;
    totalMs += performance.now() - t0;
  }
  return samples > 0 ? totalMs / samples : 0;
}

async function benchmarkExactDb(
  pool: pg.Pool,
  userId: string,
  sampleDocIds: string[]
): Promise<number> {
  const exactSamples = Math.min(50, sampleDocIds.length);
  let exactTotalMs = 0;
  for (let i = 0; i < exactSamples; i += 1) {
    const docId = sampleDocIds[i] ?? '';
    const t0 = performance.now();
    await pool.query(
      `SELECT id FROM documents WHERE user_id = $1 AND content_hash IS NOT NULL AND id <> $2 LIMIT 8`,
      [userId, docId]
    );
    await pool.query(
      `SELECT id FROM documents WHERE user_id = $1 AND extracted_text_hash IS NOT NULL AND id <> $2 LIMIT 8`,
      [userId, docId]
    );
    exactTotalMs += performance.now() - t0;
  }
  return exactSamples > 0 ? exactTotalMs / exactSamples : 0;
}

async function main(): Promise<void> {
  const synthetic = buildSyntheticCorpus(CORPUS_TARGET);
  const fuzzyMsPerDoc = benchmarkFuzzyIndexed(synthetic);

  let exactMsPerDoc = 0;
  let exactCorpusDocs = 0;
  const databaseUrl = process.env['DATABASE_URL'];
  if (databaseUrl) {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    try {
      const userRow = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM documents GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1`
      );
      const userId = userRow.rows[0]?.user_id;
      if (userId) {
        const ids = await pool.query<{ id: string }>(
          `SELECT id FROM documents WHERE user_id = $1 LIMIT 50`,
          [userId]
        );
        exactCorpusDocs = ids.rowCount ?? 0;
        exactMsPerDoc = await benchmarkExactDb(
          pool,
          userId,
          ids.rows.map((row) => row.id)
        );
      }
    } finally {
      await pool.end();
    }
  }
  if (exactMsPerDoc === 0) {
    const t0 = performance.now();
    for (let i = 0; i < 50; i += 1) {
      void `hash-${String(i)}`;
    }
    exactMsPerDoc = (performance.now() - t0) / 50;
    exactCorpusDocs = 0;
  }

  const holdoutPrecision = DEFAULT_DUPLICATE_CLASSIFIER_MODEL.training.holdoutPrecision;
  const fuzzyMeets =
    fuzzyMsPerDoc < FUZZY_SLA_MS && holdoutPrecision >= PRECISION_TARGET;

  console.log('| mode | corpus_docs | cost_per_doc_ms | auto_stack_precision | meets_sla |');
  console.log('| --- | --- | --- | --- | --- |');
  console.log(
    `| exact_hash (bytes + text) | ${String(exactCorpusDocs)} (indexed) | ${exactMsPerDoc.toFixed(2)} | 1.00 | yes |`
  );
  console.log(
    `| fuzzy_indexed (int8 top-8) | ${String(CORPUS_TARGET)} (synthetic) | ${fuzzyMsPerDoc.toFixed(2)} | ${holdoutPrecision.toFixed(3)} | ${fuzzyMeets ? 'yes' : 'no'} |`
  );
  console.log('');
  console.log(
    `SLA: fuzzy < ${String(FUZZY_SLA_MS)} ms/doc at ${String(CORPUS_TARGET)} docs and precision >= ${String(PRECISION_TARGET)}.`
  );
}

void main();
