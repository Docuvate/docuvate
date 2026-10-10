// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';
import { HttpEmbeddingDensityAdapter } from '../infrastructure/http-embedding-density.adapter.js';
import { PgEmbeddingDensityRepository } from '../infrastructure/pg-embedding-density.repository.js';
@Injectable()
export class ApplyEmbeddingDensitySuggestionsUseCase {
  private readonly logger = new Logger(ApplyEmbeddingDensitySuggestionsUseCase.name);

  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly densityRepo: PgEmbeddingDensityRepository,
    private readonly densityWorker: HttpEmbeddingDensityAdapter
  ) {}

  async tryApply(
    documentId: string,
    userId: string,
    vector: number[]
  ): Promise<boolean> {
    if (!embeddingDensityGloballyEnabled()) {
      return false;
    }

    try {
      if (!(await this.densityRepo.isCalibrationReady(userId))) {
        return false;
      }

      const tags = await this.taxonomy.listTags(userId);
      const tagIds = tags.filter((t) => !t.isInbox).map((t) => t.id);
      if (tagIds.length === 0) {
        return false;
      }

      const state = await this.densityRepo.loadWorkerState(userId, tagIds);
      if (!state || Object.keys(state.class_stats).length === 0) {
        return false;
      }

      const result = await this.densityWorker.classify(state, vector);
      const assigned = new Set(
        (await this.taxonomy.listTagsForDocument(documentId)).map((t) => t.id)
      );
      const tagById = new Map(tags.map((t) => [t.id, t]));

      let stored = false;

      if (result.decisionTier === 'auto_apply' && result.labelId && !assigned.has(result.labelId)) {
        const tag = tagById.get(result.labelId);
        if (tag && !tag.isInbox) {
          await this.taxonomy.assignTagToDocument(documentId, result.labelId);
          await this.taxonomy.clearInboxTagForDocument(documentId, userId);
          stored = true;
        }
      }

      const confirmId = result.confirmLabelId ?? (result.decisionTier === 'confirm' ? result.labelId : null);
      const confirmConf =
        result.confirmLabelId !== null
          ? result.confirmConfidence
          : result.decisionTier === 'confirm'
            ? result.confidence
            : 0;
      if (confirmId && !assigned.has(confirmId)) {
        const tag = tagById.get(confirmId);
        if (tag && !tag.isInbox) {
          const pct = Math.round(confirmConf * 100);
          await this.taxonomy.upsertSuggestion(
            documentId,
            confirmId,
            `Density model ${String(pct)}% (${tag.name})`,
            {
              source: 'embedding_density',
              confidence: confirmConf,
              decisionTier: 'confirm',
            }
          );
          stored = true;
        }
      }

      return stored;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding density suggestions skipped for ${documentId}: ${message}`);
      return false;
    }
  }
}
