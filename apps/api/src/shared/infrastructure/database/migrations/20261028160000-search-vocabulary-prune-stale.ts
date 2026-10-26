// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

import { recomputeSearchVocabularyDocFrequencyAll } from '../../../../modules/search/infrastructure/search-vocabulary-backfill.js';

/**
 * Recomputes doc_frequency and deletes vocabulary terms with no document occurrences.
 * Idempotent; safe to rerun.
 */
export class SearchVocabularyPruneStale20261028160000 implements MigrationInterface {
  name = 'SearchVocabularyPruneStale20261028160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await recomputeSearchVocabularyDocFrequencyAll(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SELECT 1');
  }
}
