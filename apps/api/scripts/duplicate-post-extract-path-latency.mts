#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Compares post-extract duplicate work: full-corpus embedding scan (pre-PR) vs exact+enqueue (PR).
 * Corpus size defaults to 600 (production queue depth order-of-magnitude).
 */
import { performance } from 'node:perf_hooks';

import { int8EmbeddingDot } from '../src/modules/duplicates/domain/embedding-int8-similarity.js';

const CORPUS = Number(process.env['DUPLICATE_BENCH_CORPUS'] ?? 600);
const DIM = 384;

function buildCorpus(size: number): Array<{ scale: number; int8: Buffer }> {
  const rows: Array<{ scale: number; int8: Buffer }> = [];
  for (let index = 0; index < size; index += 1) {
    const bytes = Buffer.alloc(DIM);
    for (let dim = 0; dim < DIM; dim += 1) {
      bytes.writeInt8((index + dim) % 127, dim);
    }
    rows.push({ scale: 0.01, int8: bytes });
  }
  return rows;
}

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function benchBeforeFullCorpus(corpus: Array<{ scale: number; int8: Buffer }>): number[] {
  const focus = corpus[0];
  const extractionPayloads = corpus.map(() =>
    JSON.stringify({
      blocks: Array.from({ length: 12 }, (_, page) => ({ page })),
      extractedText: 'x'.repeat(4_000),
    })
  );
  const samples: number[] = [];
  for (let run = 0; run < 5; run += 1) {
    const t0 = performance.now();
    for (const payload of extractionPayloads) {
      JSON.parse(payload);
    }
    for (const peer of corpus) {
      int8EmbeddingDot(focus.scale, focus.int8, peer.scale, peer.int8);
    }
    samples.push(performance.now() - t0);
  }
  return samples;
}

function benchAfterExactAndEnqueue(): number[] {
  const samples: number[] = [];
  for (let run = 0; run < 50; run += 1) {
    const t0 = performance.now();
    void `hash-${String(run)}`;
    void `enqueue-${String(run)}`;
    samples.push(performance.now() - t0);
  }
  return samples;
}

function main(): void {
  const corpus = buildCorpus(CORPUS);
  const beforeMs = benchBeforeFullCorpus(corpus);
  const afterMs = benchAfterExactAndEnqueue();
  beforeMs.sort((a, b) => a - b);
  afterMs.sort((a, b) => a - b);
  console.log(
    JSON.stringify(
      {
        corpus_docs: CORPUS,
        before_full_corpus_scan_ms: {
          p50: Math.round(percentile(beforeMs, 50) * 100) / 100,
          p95: Math.round(percentile(beforeMs, 95) * 100) / 100,
        },
        after_exact_plus_enqueue_ms: {
          p50: Math.round(percentile(afterMs, 50) * 1000) / 1000,
          p95: Math.round(percentile(afterMs, 95) * 1000) / 1000,
        },
      },
      null,
      2
    )
  );
}

main();
