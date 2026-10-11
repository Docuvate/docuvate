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

const TOP_CANDIDATE_COUNT = 3;

export type EmbeddingDensitySuggestionOutcome = 'not_ready' | 'handled';

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
  ): Promise<EmbeddingDensitySuggestionOutcome> {
    if (!embeddingDensityGloballyEnabled()) {
      return 'not_ready';
    }

    try {
      if (!(await this.densityRepo.isCalibrationReady(userId))) {
        return 'not_ready';
      }

      const tags = await this.taxonomy.listTags(userId);
      const tagIds = tags.filter((t) => !t.isInbox).map((t) => t.id);
      if (tagIds.length === 0) {
        return 'handled';
      }

      const state = await this.densityRepo.loadWorkerState(userId, tagIds);
      if (!state || Object.keys(state.class_stats).length === 0) {
        return 'handled';
      }

      const result = await this.densityWorker.classify(state, vector);
      const assigned = new Set(
        (await this.taxonomy.listTagsForDocument(documentId)).map((t) => t.id)
      );
      const tagById = new Map(tags.map((t) => [t.id, t]));

      if (result.decisionTier === 'auto_apply' && result.labelId && !assigned.has(result.labelId)) {
        const tag = tagById.get(result.labelId);
        if (tag && !tag.isInbox) {
          await this.taxonomy.assignTagToDocument(documentId, result.labelId);
          await this.taxonomy.clearInboxTagForDocument(documentId, userId);
        }
      }

      const confirmId =
        result.confirmLabelId ?? (result.decisionTier === 'confirm' ? result.labelId : null);
      const confirmConf =
        result.confirmLabelId !== null
          ? result.confirmConfidence
          : result.decisionTier === 'confirm'
            ? result.confidence
            : 0;

      const rankedCandidates = [
        confirmId,
        ...Object.entries(result.posterior)
          .sort((a, b) => b[1] - a[1])
          .map(([tagId]) => tagId),
      ].filter((tagId): tagId is string => typeof tagId === 'string' && tagId.length > 0);
      const rankedIds = [...new Set(rankedCandidates)]
        .filter((tagId) => !assigned.has(tagId))
        .slice(0, TOP_CANDIDATE_COUNT);

      for (const tagId of rankedIds) {
        const tag = tagById.get(tagId);
        if (!tag || tag.isInbox) {
          continue;
        }
        const confidence =
          tagId === confirmId ? confirmConf : (result.posterior[tagId] ?? result.confidence);
        const tier =
          tagId === confirmId && confirmId
            ? 'confirm'
            : result.decisionTier === 'auto_apply' && tagId === result.labelId
              ? 'auto_apply'
              : 'none';
        const pct = Math.round(confidence * 100);
        await this.taxonomy.upsertSuggestion(
          documentId,
          tagId,
          `NEST ${String(pct)}% (${tag.name})`,
          {
            source: 'embedding_density',
            confidence,
            decisionTier: tier,
          }
        );
      }

      return 'handled';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding density suggestions skipped for ${documentId}: ${message}`);
      return 'handled';
    }
  }
}
