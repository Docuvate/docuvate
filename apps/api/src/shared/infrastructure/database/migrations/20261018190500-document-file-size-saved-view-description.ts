// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentFileSizeSavedViewDescription20261018190500 implements MigrationInterface {
  name = 'DocumentFileSizeSavedViewDescription20261018190500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE documents
        ADD COLUMN IF NOT EXISTS file_size_bytes bigint NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE saved_document_views
        ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE saved_document_views
        DROP COLUMN IF EXISTS description
    `);
    await queryRunner.query(`
      ALTER TABLE documents
        DROP COLUMN IF EXISTS file_size_bytes
    `);
  }
}
