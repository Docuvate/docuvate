// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DEFAULT_DUPLICATE_CLASSIFIER_MODEL,
  type DuplicateFeatureVector,
  type DuplicateTrainingSample,
  fitUserLogitInterceptDelta,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type { DuplicatePairLabelRepository } from '../../../shared/domain/ports.js';
import {
  parseNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function canonicalPair(documentIdA: string, documentIdB: string): [string, string] {
  return documentIdA < documentIdB ? [documentIdA, documentIdB] : [documentIdB, documentIdA];
}

@Injectable()
export class PgDuplicatePairLabelRepository implements DuplicatePairLabelRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async getLogitInterceptDelta(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT logit_intercept_delta FROM duplicate_user_calibration WHERE user_id = $1`,
      [userId]
    );
    const raw: unknown = result.rows[0];
    if (!raw) return 0;
    return parseNumber(requireRecord(raw).logit_intercept_delta);
  }

  async upsertLabel(
    userId: string,
    documentIdA: string,
    documentIdB: string,
    label: 'duplicate' | 'not_duplicate',
    features: DuplicateFeatureVector
  ): Promise<void> {
    const [a, b] = canonicalPair(documentIdA, documentIdB);
    await this.pool.query(
      `INSERT INTO duplicate_pair_labels (
         user_id, document_id_a, document_id_b, label,
         embedding_similarity, fraction_differing_tokens, fraction_differing_value_tokens,
         relative_page_count_diff, perceptual_page_hash_distance, shingle_jaccard_distance
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (user_id, document_id_a, document_id_b) DO UPDATE SET
         label = EXCLUDED.label,
         embedding_similarity = EXCLUDED.embedding_similarity,
         fraction_differing_tokens = EXCLUDED.fraction_differing_tokens,
         fraction_differing_value_tokens = EXCLUDED.fraction_differing_value_tokens,
         relative_page_count_diff = EXCLUDED.relative_page_count_diff,
         perceptual_page_hash_distance = EXCLUDED.perceptual_page_hash_distance,
         shingle_jaccard_distance = EXCLUDED.shingle_jaccard_distance,
         created_at = now()`,
      [
        userId,
        a,
        b,
        label,
        features.embeddingSimilarity,
        features.fractionDifferingTokens,
        features.fractionDifferingValueTokens,
        features.relativePageCountDiff,
        features.perceptualPageHashDistance,
        features.shingleJaccardDistance,
      ]
    );
  }

  async refitUserCalibration(userId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT label, embedding_similarity, fraction_differing_tokens, fraction_differing_value_tokens,
              relative_page_count_diff, perceptual_page_hash_distance, shingle_jaccard_distance
       FROM duplicate_pair_labels
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 200`,
      [userId]
    );
    const samples: DuplicateTrainingSample[] = result.rows.map((raw) => {
      const row = requireRecord(raw);
      const label = parseString(row.label) === 'duplicate' ? 1 : 0;
      return {
        label,
        features: {
          embeddingSimilarity: parseNumber(row.embedding_similarity),
          fractionDifferingTokens: parseNumber(row.fraction_differing_tokens),
          fractionDifferingValueTokens: parseNumber(row.fraction_differing_value_tokens),
          relativePageCountDiff: parseNumber(row.relative_page_count_diff),
          perceptualPageHashDistance: parseNumber(row.perceptual_page_hash_distance),
          shingleJaccardDistance: parseNumber(row.shingle_jaccard_distance),
        },
      };
    });
    const delta = fitUserLogitInterceptDelta(samples, DEFAULT_DUPLICATE_CLASSIFIER_MODEL.weights);
    await this.pool.query(
      `INSERT INTO duplicate_user_calibration (user_id, logit_intercept_delta, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET
         logit_intercept_delta = EXCLUDED.logit_intercept_delta,
         updated_at = now()`,
      [userId, delta]
    );
  }
}
