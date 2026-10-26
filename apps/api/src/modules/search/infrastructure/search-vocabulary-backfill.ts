// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';

export interface SqlQueryExecutor {
  query: (query: string, parameters?: unknown[]) => Promise<unknown>;
}

const BATCH_SIZE = 250;

const UPSERT_CHUNK_TERMS_SQL = `
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT d.user_id,
       tok.term,
       'chunk',
       count(*)::int,
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
  doc_frequency = search_vocabulary_terms.doc_frequency + EXCLUDED.doc_frequency,
  updated_at = now()`;

const UPSERT_DOCUMENT_META_TERMS_SQL = `
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT d.user_id,
       tok.term,
       'document',
       count(*)::int,
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
  doc_frequency = search_vocabulary_terms.doc_frequency + EXCLUDED.doc_frequency,
  updated_at = now()`;

const UPSERT_FIELD_TERMS_SQL = `
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT d.user_id,
       tok.term,
       'document',
       count(*)::int,
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
  doc_frequency = search_vocabulary_terms.doc_frequency + EXCLUDED.doc_frequency,
  updated_at = now()`;

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
