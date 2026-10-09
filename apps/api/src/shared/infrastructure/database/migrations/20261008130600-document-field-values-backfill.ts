// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Historical step kept for ordering. Field values are rebuilt from the extraction payload by
 * SchemaNormalization3nf20261008131000, which owns the final table shape, so nothing runs here.
 */
export class DocumentFieldValuesBackfill20261008130600 implements MigrationInterface {
  name = 'DocumentFieldValuesBackfill20261008130600';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally empty, see class comment.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM document_field_values');
  }
}
