// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';
import { HttpEmbeddingDensityAdapter } from '../infrastructure/http-embedding-density.adapter.js';
import { PgEmbeddingDensityRepository } from '../infrastructure/pg-embedding-density.repository.js';

const MAX_PROPAGATION_SCAN = 400;

@Injectable()
export class ApplySparkLabelPropagationUseCase {
  private readonly logger = new Logger(ApplySparkLabelPropagationUseCase.name);

  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    private readonly densityRepo: PgEmbeddingDensityRepository,
    private readonly densityWorker: HttpEmbeddingDensityAdapter
  ) {}

  async propagateAfterLabelCorrection(
    userId: string,
    toTagId: string,
    sourceDocumentId: string
  ): Promise<number> {
    if (!embeddingDensityGloballyEnabled()) {
      return 0;
    }
    try {
      if (!(await this.densityRepo.isCalibrationReady(userId))) {
        return 0;
      }
      const tagIds = (await this.densityRepo.listTrainingExamples(userId)).allLabelIds;
      if (tagIds.length === 0) {
        return 0;
      }
      const state = await this.densityRepo.loadWorkerState(userId, tagIds);
      if (!state) {
        return 0;
      }
      const references = await this.labelEmbeddings.listDocumentEmbeddingsForUser(userId);
      const candidates = references
        .filter((ref) => ref.documentId !== sourceDocumentId)
        .slice(0, MAX_PROPAGATION_SCAN);
      let updated = 0;
      for (const ref of candidates) {
        if (ref.nonInboxTagIds.includes(toTagId)) {
          continue;
        }
        const result = await this.densityWorker.classify(state, ref.embedding);
        if (result.decisionTier !== 'auto_apply' || result.labelId !== toTagId) {
          continue;
        }
        await this.taxonomy.assignTagToDocument(ref.documentId, toTagId);
        await this.taxonomy.clearInboxTagForDocument(ref.documentId, userId);
        updated += 1;
      }
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SPARK label propagation skipped for user ${userId}: ${message}`);
      return 0;
    }
  }
}
