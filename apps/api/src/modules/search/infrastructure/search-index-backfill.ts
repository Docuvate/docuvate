import type pg from 'pg';
import { PgGlobalSearchRepository } from './pg-global-search.repository.js';

export async function backfillDocumentTextChunks(pool: pg.Pool): Promise<void> {
  const repo = new PgGlobalSearchRepository(pool);
  const rows = await pool.query<{ id: string; user_id: string; extracted_text: string | null }>(
    `SELECT id, user_id, extracted_text FROM documents
     WHERE extracted_text IS NOT NULL AND length(trim(extracted_text)) > 0`
  );
  for (const row of rows.rows) {
    await repo.indexDocumentChunks(row.user_id, row.id, row.extracted_text ?? '');
  }
}

export async function backfillSearchVocabularyTerms(pool: pg.Pool): Promise<void> {
  const repo = new PgGlobalSearchRepository(pool);
  const users = await pool.query<{ user_id: string }>(
    `SELECT DISTINCT user_id FROM documents`
  );
  for (const { user_id: userId } of users.rows) {
    const docs = await pool.query<{
      title: string;
      filename: string;
      extracted_text: string | null;
    }>(
      `SELECT title, filename, extracted_text FROM documents WHERE user_id = $1`,
      [userId]
    );
    for (const row of docs.rows) {
      await repo.upsertVocabularyTerms(userId, row.title, 'document');
      await repo.upsertVocabularyTerms(userId, row.filename, 'document');
      if (row.extracted_text) {
        await repo.upsertVocabularyTerms(userId, row.extracted_text.slice(0, 4000), 'document');
      }
    }
    const chunks = await pool.query<{ body: string }>(
      `SELECT body FROM document_text_chunks WHERE user_id = $1`,
      [userId]
    );
    for (const row of chunks.rows) {
      await repo.upsertVocabularyTerms(userId, row.body, 'chunk');
    }
  }
}
