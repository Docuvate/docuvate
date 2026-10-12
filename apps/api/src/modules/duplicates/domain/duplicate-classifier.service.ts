// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  buildDuplicateFeatureVector,
  decideDuplicatePair,
  DEFAULT_DUPLICATE_CLASSIFIER_MODEL,
  type DuplicateCompareDocumentInput,
  type DuplicatePairDecision,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  DUPLICATE_PAIR_LABEL_REPOSITORY,
  type DuplicatePairLabelRepository,
} from '../../../shared/domain/ports.js';

export interface DuplicatePairEvaluationInput {
  left: DuplicateCompareDocumentInput;
  right: DuplicateCompareDocumentInput;
  embeddingSimilarity: number;
  perceptualPageHashDistance: number | null;
}

@Injectable()
export class DuplicateClassifierService {
  constructor(
    @Inject(DUPLICATE_PAIR_LABEL_REPOSITORY)
    private readonly pairLabels: DuplicatePairLabelRepository
  ) {}

  async evaluate(
    userId: string,
    input: DuplicatePairEvaluationInput
  ): Promise<{ decision: DuplicatePairDecision; probability: number }> {
    const features = buildDuplicateFeatureVector({
      left: input.left,
      right: input.right,
      embeddingSimilarity: input.embeddingSimilarity,
      perceptualPageHashDistance: input.perceptualPageHashDistance,
    });
    const delta = await this.pairLabels.getLogitInterceptDelta(userId);
    return decideDuplicatePair(DEFAULT_DUPLICATE_CLASSIFIER_MODEL, features, delta);
  }

  async recordUserLabel(
    userId: string,
    documentIdA: string,
    documentIdB: string,
    label: 'duplicate' | 'not_duplicate',
    input: DuplicatePairEvaluationInput
  ): Promise<void> {
    const features = buildDuplicateFeatureVector({
      left: input.left,
      right: input.right,
      embeddingSimilarity: input.embeddingSimilarity,
      perceptualPageHashDistance: input.perceptualPageHashDistance,
    });
    await this.pairLabels.upsertLabel(userId, documentIdA, documentIdB, label, features);
    await this.pairLabels.refitUserCalibration(userId);
  }
}
