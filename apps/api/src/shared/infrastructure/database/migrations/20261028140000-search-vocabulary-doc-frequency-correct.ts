// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { MigrationInterface, QueryRunner } from 'typeorm';

import { recomputeSearchVocabularyDocFrequencyAll } from '../../../../modules/search/infrastructure/search-vocabulary-backfill.js';

/**
 * Corrects doc_frequency inflated by token-occurrence counting in the batch backfill.
 * Recomputes distinct document counts per (user_id, term); safe to rerun.
 */
export class SearchVocabularyDocFrequencyCorrect20261028140000 implements MigrationInterface {
  name = 'SearchVocabularyDocFrequencyCorrect20261028140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await recomputeSearchVocabularyDocFrequencyAll(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SELECT 1');
  }
}
