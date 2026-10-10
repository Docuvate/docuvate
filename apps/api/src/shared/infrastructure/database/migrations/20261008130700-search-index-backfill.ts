// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

import { tokenizeSearchQuery } from '../../../../modules/search/domain/normalize-search-text.js';
import { splitTextChunks } from '../../../../modules/search/domain/split-text-chunks.js';
import { parseOptionalString, parseString, requireRecord } from '../row-parse.js';

const MAX_TERMS_PER_TEXT = 200;
const DOCUMENT_TEXT_SLICE = 4000;

async function upsertVocabularyTerms(
  queryRunner: QueryRunner,
  userId: string,
  text: string,
  source: 'document' | 'chunk'
): Promise<void> {
  const unique = [...new Set(tokenizeSearchQuery(text))].filter(
    (t) => t.length >= 3 && t.length <= 48
  );
  for (const term of unique.slice(0, MAX_TERMS_PER_TEXT)) {
    await queryRunner.query(
      `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (user_id, term) DO UPDATE SET doc_frequency = search_vocabulary_terms.doc_frequency + 1`,
      [userId, term, source]
    );
  }
}

/**
 * Builds text chunks and the vocabulary for documents that existed before global search.
 * Self-contained on purpose: it writes the table shapes of this point in the migration history
 * (document_text_chunks still carries user_id here; SchemaNormalization3nf drops it later).
 */
export class SearchIndexBackfill20261008130700 implements MigrationInterface {
  name = 'SearchIndexBackfill20261008130700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rawDocuments: unknown = await queryRunner.query(
      `SELECT id, user_id, title, filename, extracted_text FROM documents ORDER BY created_at, id`
    );
    if (!Array.isArray(rawDocuments)) {
      return;
    }
    const documents: {
      id: string;
      user_id: string;
      title: string | null;
      filename: string | null;
      extracted_text: string | null;
    }[] = [];
    for (const row of rawDocuments) {
      const record = requireRecord(row);
      documents.push({
        id: parseString(record.id),
        user_id: parseString(record.user_id),
        title: parseOptionalString(record.title),
        filename: parseOptionalString(record.filename),
        extracted_text: parseOptionalString(record.extracted_text),
      });
    }
    for (const doc of documents) {
      const text = doc.extracted_text ?? '';
      if (text.trim().length > 0) {
        const chunks = splitTextChunks(text);
        for (const [index, body] of chunks.entries()) {
          await queryRunner.query(
            `INSERT INTO document_text_chunks (document_id, user_id, chunk_index, body, updated_at)
             VALUES ($1, $2, $3, $4, now())
             ON CONFLICT DO NOTHING`,
            [doc.id, doc.user_id, index, body]
          );
          await upsertVocabularyTerms(queryRunner, doc.user_id, body, 'chunk');
        }
        await upsertVocabularyTerms(
          queryRunner,
          doc.user_id,
          text.slice(0, DOCUMENT_TEXT_SLICE),
          'document'
        );
      }
      await upsertVocabularyTerms(queryRunner, doc.user_id, doc.title ?? '', 'document');
      await upsertVocabularyTerms(queryRunner, doc.user_id, doc.filename ?? '', 'document');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM document_text_chunks');
    await queryRunner.query('DELETE FROM search_vocabulary_terms');
  }
}
