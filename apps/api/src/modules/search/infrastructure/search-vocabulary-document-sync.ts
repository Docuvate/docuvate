// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import { parseString } from '../../../shared/infrastructure/database/row-parse.js';
import {
  normalizeSearchText,
  tokenizeSearchQuery,
} from '../domain/normalize-search-text.js';
import type { SqlQueryExecutor } from './search-vocabulary-backfill.js';
import { readQueryRows } from './search-vocabulary-backfill.js';

/** Same advisory lock class as document_text_chunks reindex (per document_id). */
export const DOCUMENT_VOCABULARY_LOCK_HI = 0x44544348;

export function documentVocabularyLockKey(documentId: string): { high: number; low: number } {
  const hex = documentId.replace(/-/g, '');
  const low = Number.parseInt(hex.slice(0, 8), 16) | 0;
  return { high: DOCUMENT_VOCABULARY_LOCK_HI, low };
}

const MAX_TERMS_PER_DOCUMENT = 400;

export function vocabularyTermsFromTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const text of texts) {
    for (const token of tokenizeSearchQuery(text)) {
      const normalized = normalizeSearchText(token);
      if (normalized.length < 3 || normalized.length > 48) {
        continue;
      }
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      terms.push(normalized);
      if (terms.length >= MAX_TERMS_PER_DOCUMENT) {
        return terms;
      }
    }
  }
  return terms;
}

const LOAD_DOCUMENT_VOCABULARY_TEXTS_SQL = `
SELECT coalesce(c.body, '') AS body
FROM document_text_chunks c
WHERE c.document_id = $1
UNION ALL
SELECT coalesce(d.title, '') AS body
FROM documents d
WHERE d.id = $1
UNION ALL
SELECT coalesce(d.filename, '') AS body
FROM documents d
WHERE d.id = $1
UNION ALL
SELECT coalesce(d.extracted_text, '') AS body
FROM documents d
WHERE d.id = $1
UNION ALL
SELECT coalesce(v.value_text_norm, v.value_text, '') AS body
FROM document_field_values v
WHERE v.document_id = $1`;

export async function loadDocumentVocabularyTerms(
  executor: SqlQueryExecutor,
  documentId: string
): Promise<string[]> {
  const rows = readQueryRows(await executor.query(LOAD_DOCUMENT_VOCABULARY_TEXTS_SQL, [documentId]));
  const texts: string[] = [];
  for (const row of rows) {
    texts.push(parseString(row.body));
  }
  return vocabularyTermsFromTexts(texts);
}

const REMOVE_DOCUMENT_VOCABULARY_TERMS_SQL = `
WITH removed AS (
  DELETE FROM search_vocabulary_document_terms j
  WHERE j.document_id = $2
    AND j.term = ANY($3::text[])
  RETURNING j.term
),
agg AS (
  SELECT term, count(*)::int AS n
  FROM removed
  GROUP BY term
)
UPDATE search_vocabulary_terms s
SET doc_frequency = s.doc_frequency - a.n,
    updated_at = now()
FROM agg a
WHERE s.user_id = $1
  AND s.term = a.term`;

const ADD_DOCUMENT_VOCABULARY_TERMS_SQL = `
WITH inserted AS (
  INSERT INTO search_vocabulary_document_terms (user_id, document_id, term)
  SELECT $1, $2, t.term
  FROM unnest($3::text[]) AS t(term)
  ON CONFLICT (document_id, term) DO NOTHING
  RETURNING term
)
INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
SELECT $1, i.term, 'document', 1, now()
FROM inserted i
ON CONFLICT (user_id, term) DO UPDATE SET
  doc_frequency = search_vocabulary_terms.doc_frequency + 1,
  updated_at = now()`;

async function applyVocabularyTermDiff(
  client: pg.PoolClient,
  userId: string,
  documentId: string,
  removed: string[],
  added: string[]
): Promise<void> {
  if (removed.length > 0) {
    await client.query(REMOVE_DOCUMENT_VOCABULARY_TERMS_SQL, [userId, documentId, removed]);
    await client.query(
      `DELETE FROM search_vocabulary_terms WHERE user_id = $1 AND doc_frequency <= 0`,
      [userId]
    );
  }
  if (added.length > 0) {
    await client.query(ADD_DOCUMENT_VOCABULARY_TERMS_SQL, [userId, documentId, added]);
  }
}

async function refreshDocumentVocabularyTermsOnClient(
  client: pg.PoolClient,
  userId: string,
  documentId: string
): Promise<void> {
  const lockKey = documentVocabularyLockKey(documentId);
  await client.query('BEGIN');
  try {
    await client.query(`SELECT pg_advisory_xact_lock($1, $2)`, [lockKey.high, lockKey.low]);
    const oldRows = readQueryRows(
      await client.query(
        `SELECT term FROM search_vocabulary_document_terms WHERE document_id = $1`,
        [documentId]
      )
    );
    const oldTerms = new Set(oldRows.map((row) => parseString(row.term)));
    const newTerms = await loadDocumentVocabularyTerms(client, documentId);
    const newSet = new Set(newTerms);
    const removed: string[] = [];
    for (const term of oldTerms) {
      if (!newSet.has(term)) {
        removed.push(term);
      }
    }
    const added: string[] = [];
    for (const term of newSet) {
      if (!oldTerms.has(term)) {
        added.push(term);
      }
    }
    await applyVocabularyTermDiff(client, userId, documentId, removed, added);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function releaseDocumentVocabularyTermsOnClient(
  client: pg.PoolClient,
  userId: string,
  documentId: string
): Promise<void> {
  const lockKey = documentVocabularyLockKey(documentId);
  await client.query('BEGIN');
  try {
    await client.query(`SELECT pg_advisory_xact_lock($1, $2)`, [lockKey.high, lockKey.low]);
    const oldRows = readQueryRows(
      await client.query(
        `SELECT term FROM search_vocabulary_document_terms WHERE document_id = $1`,
        [documentId]
      )
    );
    const removed = oldRows.map((row) => parseString(row.term));
    await applyVocabularyTermDiff(client, userId, documentId, removed, []);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

function isPgPool(db: pg.Pool | pg.PoolClient): db is pg.Pool {
  return 'connect' in db && 'totalCount' in db;
}

export async function refreshDocumentVocabularyTerms(
  db: pg.Pool | pg.PoolClient,
  userId: string,
  documentId: string
): Promise<void> {
  if (isPgPool(db)) {
    const client = await db.connect();
    try {
      await refreshDocumentVocabularyTermsOnClient(client, userId, documentId);
    } finally {
      client.release();
    }
    return;
  }
  await refreshDocumentVocabularyTermsOnClient(db, userId, documentId);
}

export async function releaseDocumentVocabularyTerms(
  db: pg.Pool | pg.PoolClient,
  userId: string,
  documentId: string
): Promise<void> {
  if (isPgPool(db)) {
    const client = await db.connect();
    try {
      await releaseDocumentVocabularyTermsOnClient(client, userId, documentId);
    } finally {
      client.release();
    }
    return;
  }
  await releaseDocumentVocabularyTermsOnClient(db, userId, documentId);
}

export async function releaseDocumentVocabularyTermsBatch(
  pool: pg.Pool,
  userId: string,
  documentIds: string[]
): Promise<void> {
  for (const documentId of documentIds) {
    await releaseDocumentVocabularyTerms(pool, userId, documentId);
  }
}
