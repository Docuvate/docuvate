// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

/** Run SQL in a short transaction with pg_trgm.word_similarity_threshold set for <% / %> index use. */
export async function queryWithWordSimilarityThreshold<R extends pg.QueryResultRow>(
  pool: pg.Pool,
  wordSimilarityThreshold: number,
  queryText: string,
  values?: unknown[]
): Promise<pg.QueryResult<R>> {
  const client = await pool.connect();
  const thresholdLiteral = String(wordSimilarityThreshold);
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL pg_trgm.word_similarity_threshold = ${thresholdLiteral}`);
    const result = await client.query<R>(queryText, values);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
