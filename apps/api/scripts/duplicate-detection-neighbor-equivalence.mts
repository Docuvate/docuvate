#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Compares legacy full-corpus float cosine ranking vs int8 compact neighbor ranking.
 * Run after `pnpm --filter @docuvate/api build` with DATABASE_URL set.
 */
import pg from 'pg';

import { int8EmbeddingDot } from '../dist/modules/duplicates/domain/embedding-int8-similarity.js';
import { cosineSimilarity } from '../dist/modules/labels/domain/cosine.js';

const THRESHOLD = Number(process.env['DUPLICATE_EMBEDDING_THRESHOLD'] ?? 0.82);
const TOP_K = Number(process.env['DUPLICATE_MAX_EMBEDDING_CANDIDATES'] ?? 8);

function decodeMean(scale: number, buffer: Buffer): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < buffer.length; i += 1) {
    embedding.push(buffer.readInt8(i) * scale);
  }
  return embedding;
}

async function main(): Promise<void> {
  const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
  const userRow = await pool.query<{ user_id: string; document_id: string }>(
    `SELECT d.user_id, dr.document_id
     FROM document_representation dr
     JOIN documents d ON d.id = dr.document_id
     ORDER BY d.updated_at DESC
     LIMIT 1`
  );
  const focus = userRow.rows[0];
  if (!focus) {
    console.log('No document_representation rows; skip equivalence check.');
    await pool.end();
    return;
  }
  const { user_id: userId, document_id: focusId } = focus;

  const corpus = await pool.query<{
    document_id: string;
    document_mean_scale: number;
    document_mean_int8: Buffer;
  }>(
    `SELECT dr.document_id, dr.document_mean_scale, dr.document_mean_int8
     FROM document_representation dr
     JOIN documents d ON d.id = dr.document_id
     WHERE d.user_id = $1 AND dr.document_id <> $2`,
    [userId, focusId]
  );

  const source = corpus.rows.find((row) => row.document_id === focusId);
  const sourceRow = await pool.query<{
    document_mean_scale: number;
    document_mean_int8: Buffer;
  }>(
    `SELECT document_mean_scale, document_mean_int8 FROM document_representation WHERE document_id = $1`,
    [focusId]
  );
  const sourceMean = sourceRow.rows[0];
  if (!sourceMean) {
    throw new Error('focus document missing representation');
  }

  const focusVector = decodeMean(sourceMean.document_mean_scale, sourceMean.document_mean_int8);

  const legacy = corpus.rows
    .map((row) => {
      const embedding = decodeMean(row.document_mean_scale, row.document_mean_int8);
      return {
        documentId: row.document_id,
        similarity: cosineSimilarity(focusVector, embedding),
      };
    })
    .filter((row) => row.similarity >= THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K);

  const indexed = corpus.rows
    .map((row) => ({
      documentId: row.document_id,
      similarity: int8EmbeddingDot(
        sourceMean.document_mean_scale,
        sourceMean.document_mean_int8,
        row.document_mean_scale,
        row.document_mean_int8
      ),
    }))
    .filter((row) => row.similarity >= THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K);

  const legacyIds = legacy.map((row) => row.documentId);
  const indexedIds = indexed.map((row) => row.documentId);
  const sameSet =
    legacyIds.length === indexedIds.length &&
    legacyIds.every((id, index) => id === indexedIds[index]);

  console.log(
    JSON.stringify(
      {
        userId,
        focusId,
        corpusSize: corpus.rowCount,
        threshold: THRESHOLD,
        topK: TOP_K,
        legacyIds,
        indexedIds,
        rankingEquivalent: sameSet,
      },
      null,
      2
    )
  );

  await pool.end();
  if (!sameSet) {
    process.exitCode = 1;
  }
}

void main();
