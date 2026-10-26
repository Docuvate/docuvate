// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

import { backfillSearchVocabularyAllDocuments } from '../../../../modules/search/infrastructure/search-vocabulary-backfill.js';

/**
 * Idempotent batched backfill for search_vocabulary_terms on existing installs.
 * Incremental ingest already upserts vocabulary; this closes gaps for documents
 * indexed before vocabulary maintenance or without a full sync pass.
 */
export class SearchVocabularyBatchBackfill20261028120000 implements MigrationInterface {
  name = 'SearchVocabularyBatchBackfill20261028120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await backfillSearchVocabularyAllDocuments(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /* vocabulary rows are shared with live ingest; no destructive down */
    await queryRunner.query('SELECT 1');
  }
}
