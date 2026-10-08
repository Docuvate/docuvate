import pg from 'pg';
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { backfillDocumentFieldValuesFromJsonb } from '../../../../modules/search/infrastructure/document-field-value-index.js';

function migrationPool(queryRunner: QueryRunner): pg.Pool {
  const options = queryRunner.connection.options as { url?: string };
  const connectionString = process.env['DATABASE_URL'] ?? options.url;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for document_field_values backfill');
  }
  return new pg.Pool({ connectionString });
}

export class DocumentFieldValuesBackfill20261008130600 implements MigrationInterface {
  name = 'DocumentFieldValuesBackfill20261008130600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const pool = migrationPool(queryRunner);
    try {
      await backfillDocumentFieldValuesFromJsonb(pool);
    } finally {
      await pool.end();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM document_field_values');
  }
}
