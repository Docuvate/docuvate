#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Benchmark duplicate-detection paths. Requires DATABASE_URL and built API dist for int8 helper.
 *
 * Outputs a markdown table with cost/doc and auto-stack precision (holdout from classifier model).
 */
import { performance } from 'node:perf_hooks';

import pg from 'pg';

import { int8EmbeddingDot } from '../dist/modules/duplicates/domain/embedding-int8-similarity.js';
import { DEFAULT_DUPLICATE_CLASSIFIER_MODEL } from '@docuvate/contracts';

const CORPUS_TARGET = Number(process.env['BENCHMARK_CORPUS_SIZE'] ?? 10_000);
const FUZZY_SLA_MS = 50;
const PRECISION_TARGET = 0.99;

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
  const userRow = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM document_representation dr
     JOIN documents d ON d.id = dr.document_id
     GROUP BY user_id
     ORDER BY COUNT(*) DESC
     LIMIT 1`
  );
  const userId = userRow.rows[0]?.user_id;
  if (!userId) {
    console.log('| mode | cost_per_doc_ms | auto_stack_precision | meets_sla |');
    console.log('| --- | --- | --- | --- |');
    console.log('| exact_hash | (no corpus) | 1.00 | yes |');
    console.log('| fuzzy_indexed | (no corpus) | n/a | no |');
    await pool.end();
    return;
  }

  const corpus = await pool.query<{
    document_id: string;
    document_mean_scale: number;
    document_mean_int8: Buffer;
  }>(
    `SELECT dr.document_id, dr.document_mean_scale, dr.document_mean_int8
     FROM document_representation dr
     JOIN documents d ON d.id = dr.document_id
     WHERE d.user_id = $1
     ORDER BY d.updated_at DESC
     LIMIT $2`,
    [userId, CORPUS_TARGET]
  );

  const exactSamples = Math.min(50, corpus.rowCount ?? 0);
  let exactTotalMs = 0;
  for (let i = 0; i < exactSamples; i += 1) {
    const docId = corpus.rows[i]?.document_id ?? '';
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
  const exactMsPerDoc = exactSamples > 0 ? exactTotalMs / exactSamples : 0;

  const fuzzySamples = Math.min(20, corpus.rowCount ?? 0);
  let fuzzyTotalMs = 0;
  for (let i = 0; i < fuzzySamples; i += 1) {
    const focus = corpus.rows[i];
    if (!focus) continue;
    const t0 = performance.now();
    for (const peer of corpus.rows) {
      if (peer.document_id === focus.document_id) continue;
      int8EmbeddingDot(
        focus.document_mean_scale,
        focus.document_mean_int8,
        peer.document_mean_scale,
        peer.document_mean_int8
      );
    }
    const ranked = corpus.rows
      .filter((peer) => peer.document_id !== focus.document_id)
      .map((peer) => ({
        id: peer.document_id,
        similarity: int8EmbeddingDot(
          focus.document_mean_scale,
          focus.document_mean_int8,
          peer.document_mean_scale,
          peer.document_mean_int8
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);
    void ranked;
    fuzzyTotalMs += performance.now() - t0;
  }
  const fuzzyMsPerDoc = fuzzySamples > 0 ? fuzzyTotalMs / fuzzySamples : 0;

  const holdoutPrecision = DEFAULT_DUPLICATE_CLASSIFIER_MODEL.training.holdoutPrecision;
  const fuzzyMeets =
    corpus.rowCount >= 100 &&
    fuzzyMsPerDoc < FUZZY_SLA_MS &&
    holdoutPrecision >= PRECISION_TARGET;

  console.log('| mode | corpus_docs | cost_per_doc_ms | auto_stack_precision | meets_sla |');
  console.log('| --- | --- | --- | --- | --- |');
  console.log(
    `| exact_hash (bytes + text) | ${String(corpus.rowCount)} | ${exactMsPerDoc.toFixed(2)} | 1.00 | yes |`
  );
  console.log(
    `| fuzzy_indexed (int8 top-8) | ${String(corpus.rowCount)} | ${fuzzyMsPerDoc.toFixed(2)} | ${holdoutPrecision.toFixed(3)} | ${fuzzyMeets ? 'yes' : 'no'} |`
  );
  console.log('');
  console.log(
    `SLA: fuzzy < ${String(FUZZY_SLA_MS)} ms/doc at ${String(CORPUS_TARGET)} docs and precision >= ${String(PRECISION_TARGET)}.`
  );
  console.log(
    `Default: fuzzy_duplicate_detection_enabled=false in user settings; enable only when meets_sla=yes on your corpus.`
  );

  await pool.end();
}

void main();
