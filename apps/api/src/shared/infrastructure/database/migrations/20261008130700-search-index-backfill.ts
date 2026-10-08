import pg from 'pg';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import {
  backfillDocumentTextChunks,
  backfillSearchVocabularyTerms,
} from '../../../../modules/search/infrastructure/search-index-backfill.js';

function migrationPool(queryRunner: QueryRunner): pg.Pool {
  const options = queryRunner.connection.options as { url?: string };
  const connectionString = process.env['DATABASE_URL'] ?? options.url;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for search index backfill');
  }
  return new pg.Pool({ connectionString });
}

export class SearchIndexBackfill20261008130700 implements MigrationInterface {
  name = 'SearchIndexBackfill20261008130700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pool = migrationPool(queryRunner);
    try {
      await backfillDocumentTextChunks(pool);
      await backfillSearchVocabularyTerms(pool);
    } finally {
      await pool.end();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM document_text_chunks');
    await queryRunner.query('DELETE FROM search_vocabulary_terms');
  }
}
