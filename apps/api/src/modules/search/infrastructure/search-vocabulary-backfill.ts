// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';

export interface SqlQueryExecutor {
  query: (query: string, parameters?: unknown[]) => Promise<unknown>;
}

const BATCH_SIZE = 250;
const USER_RECOMPUTE_BATCH_SIZE = 25;

const UPSERT_CHUNK_TERMS_SQL = `
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT d.user_id,
       tok.term,
       'chunk',
       count(DISTINCT d.id)::int,
       now()
FROM documents d
JOIN document_text_chunks c ON c.document_id = d.id
CROSS JOIN LATERAL (
  SELECT trim(both from tok_raw) AS term
  FROM regexp_split_to_table(lower(unaccent(c.body)), '[^[:alnum:]]+') AS tok_raw
) tok
WHERE d.id = ANY($1::uuid[])
  AND length(tok.term) >= 3
  AND length(tok.term) <= 48
GROUP BY d.user_id, tok.term
ON CONFLICT (user_id, term) DO UPDATE SET
  updated_at = now()`;

const UPSERT_DOCUMENT_META_TERMS_SQL = `
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT d.user_id,
       tok.term,
       'document',
       count(DISTINCT d.id)::int,
       now()
FROM documents d
CROSS JOIN LATERAL (
  SELECT trim(both from tok_raw) AS term
  FROM regexp_split_to_table(
    lower(unaccent(concat_ws(' ', coalesce(d.title, ''), coalesce(d.filename, ''), coalesce(d.extracted_text, '')))),
    '[^[:alnum:]]+'
  ) AS tok_raw
) tok
WHERE d.id = ANY($1::uuid[])
  AND length(tok.term) >= 3
  AND length(tok.term) <= 48
GROUP BY d.user_id, tok.term
ON CONFLICT (user_id, term) DO UPDATE SET
  updated_at = now()`;

const UPSERT_FIELD_TERMS_SQL = `
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT d.user_id,
       tok.term,
       'document',
       count(DISTINCT d.id)::int,
       now()
FROM documents d
JOIN document_field_values v ON v.document_id = d.id
CROSS JOIN LATERAL (
  SELECT trim(both from tok_raw) AS term
  FROM regexp_split_to_table(
    lower(unaccent(concat_ws(' ', coalesce(v.value_text_norm, ''), coalesce(v.value_text, '')))),
    '[^[:alnum:]]+'
  ) AS tok_raw
) tok
WHERE d.id = ANY($1::uuid[])
  AND length(tok.term) >= 3
  AND length(tok.term) <= 48
GROUP BY d.user_id, tok.term
ON CONFLICT (user_id, term) DO UPDATE SET
  updated_at = now()`;

const RECOMPUTE_DOC_FREQUENCY_FOR_USER_SQL = `
WITH term_docs AS (
  SELECT d.user_id, tok.term, d.id AS document_id
  FROM documents d
  JOIN document_text_chunks c ON c.document_id = d.id
  CROSS JOIN LATERAL (
    SELECT trim(both from tok_raw) AS term
    FROM regexp_split_to_table(lower(unaccent(c.body)), '[^[:alnum:]]+') AS tok_raw
  ) tok
  WHERE d.user_id = $1
    AND length(tok.term) >= 3
    AND length(tok.term) <= 48
  UNION ALL
  SELECT d.user_id, tok.term, d.id AS document_id
  FROM documents d
  CROSS JOIN LATERAL (
    SELECT trim(both from tok_raw) AS term
    FROM regexp_split_to_table(
      lower(unaccent(concat_ws(' ', coalesce(d.title, ''), coalesce(d.filename, ''), coalesce(d.extracted_text, '')))),
      '[^[:alnum:]]+'
    ) AS tok_raw
  ) tok
  WHERE d.user_id = $1
    AND length(tok.term) >= 3
    AND length(tok.term) <= 48
  UNION ALL
  SELECT d.user_id, tok.term, d.id AS document_id
  FROM documents d
  JOIN document_field_values v ON v.document_id = d.id
  CROSS JOIN LATERAL (
    SELECT trim(both from tok_raw) AS term
    FROM regexp_split_to_table(
      lower(unaccent(concat_ws(' ', coalesce(v.value_text_norm, ''), coalesce(v.value_text, '')))),
      '[^[:alnum:]]+'
    ) AS tok_raw
  ) tok
  WHERE d.user_id = $1
    AND length(tok.term) >= 3
    AND length(tok.term) <= 48
),
counts AS (
  SELECT user_id, term, count(DISTINCT document_id)::int AS doc_frequency
  FROM term_docs
  GROUP BY user_id, term
)
UPDATE search_vocabulary_terms s
SET doc_frequency = c.doc_frequency,
    updated_at = now()
FROM counts c
WHERE s.user_id = c.user_id
  AND s.term = c.term
  AND s.user_id = $1`;

export async function recomputeSearchVocabularyDocFrequencyForUser(
  executor: SqlQueryExecutor,
  userId: string
): Promise<void> {
  await executor.query(RECOMPUTE_DOC_FREQUENCY_FOR_USER_SQL, [userId]);
}

/** Idempotent full recompute of doc_frequency (distinct documents per term). Safe to rerun. */
export async function recomputeSearchVocabularyDocFrequencyAll(
  executor: SqlQueryExecutor
): Promise<void> {
  let offset = 0;
  for (;;) {
    const rawRows: unknown = await executor.query(
      `SELECT DISTINCT user_id::text AS user_id
       FROM search_vocabulary_terms
       ORDER BY user_id
       LIMIT $1 OFFSET $2`,
      [USER_RECOMPUTE_BATCH_SIZE, offset]
    );
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return;
    }
    for (const row of rawRows) {
      const userId = parseString(requireRecord(row).user_id);
      await recomputeSearchVocabularyDocFrequencyForUser(executor, userId);
    }
    offset += USER_RECOMPUTE_BATCH_SIZE;
  }
}

async function distinctUserIdsForDocuments(
  executor: SqlQueryExecutor,
  documentIds: string[]
): Promise<string[]> {
  if (documentIds.length === 0) {
    return [];
  }
  const rawRows: unknown = await executor.query(
    `SELECT DISTINCT user_id::text AS user_id FROM documents WHERE id = ANY($1::uuid[])`,
    [documentIds]
  );
  if (!Array.isArray(rawRows)) {
    return [];
  }
  const userIds: string[] = [];
  for (const row of rawRows) {
    userIds.push(parseString(requireRecord(row).user_id));
  }
  return userIds;
}

export async function backfillSearchVocabularyForDocuments(
  executor: SqlQueryExecutor,
  documentIds: string[]
): Promise<void> {
  if (documentIds.length === 0) {
    return;
  }
  await executor.query(UPSERT_CHUNK_TERMS_SQL, [documentIds]);
  await executor.query(UPSERT_DOCUMENT_META_TERMS_SQL, [documentIds]);
  await executor.query(UPSERT_FIELD_TERMS_SQL, [documentIds]);
  const userIds = await distinctUserIdsForDocuments(executor, documentIds);
  for (const userId of userIds) {
    await recomputeSearchVocabularyDocFrequencyForUser(executor, userId);
  }
}

/** Idempotent batched backfill for installs that ingested documents before vocabulary was complete. */
export async function backfillSearchVocabularyAllDocuments(
  executor: SqlQueryExecutor
): Promise<void> {
  let offset = 0;
  for (;;) {
    const rawRows: unknown = await executor.query(
      `SELECT id::text AS id FROM documents ORDER BY id LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      await recomputeSearchVocabularyDocFrequencyAll(executor);
      return;
    }
    const documentIds: string[] = [];
    for (const row of rawRows) {
      documentIds.push(parseString(requireRecord(row).id));
    }
    await backfillSearchVocabularyForDocuments(executor, documentIds);
    offset += BATCH_SIZE;
  }
}
