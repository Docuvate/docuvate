// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import type { AssignDocumentTag } from '../domain/assign-document-tag.port.js';
import { formatAssignRecommendationReason } from '../domain/label-recommendation-scoring.js';
import { HttpCeMlAdapter } from '../infrastructure/http-ce-ml.adapter.js';
import { AssignDocumentTagUseCase } from './document-label.use-cases.js';

@Injectable()
export class ApplyCeLabelPropagationUseCase {
  private readonly logger = new Logger(ApplyCeLabelPropagationUseCase.name);

  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(AssignDocumentTagUseCase) private readonly assignTag: AssignDocumentTag,
    private readonly ceMl: HttpCeMlAdapter
  ) {}

  async propagateAfterLabelSeed(
    userId: string,
    tagId: string,
    seedDocumentIds: string[]
  ): Promise<number> {
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag || tag.isInbox) {
      return 0;
    }
    const rows = (await this.labelEmbeddings.listDocumentEmbeddingsForUser(userId)).filter(
      (row) => row.embedding.length > 0
    );
    if (rows.length === 0) {
      return 0;
    }
    const indexByDocumentId = new Map(rows.map((row, index) => [row.documentId, index] as const));
    const seedIndices = seedDocumentIds
      .map((documentId) => indexByDocumentId.get(documentId))
      .filter((index): index is number => index != null);
    let scores;
    try {
      scores = await this.ceMl.propagateLabelScores({
        labelName: tag.name,
        passageVectors: rows.map((row) => row.embedding),
        seedDocumentIndices: seedIndices,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`CE label propagation skipped for user ${userId}: ${message}`);
      return 0;
    }

    let applied = 0;
    for (const score of scores) {
      const row = rows.at(score.documentIndex);
      if (row === undefined) {
        continue;
      }
      if (row.nonInboxTagIds.length > 0) {
        continue;
      }
      if (score.tier === 'none') {
        continue;
      }
      if (score.tier === 'auto_assign') {
        await this.assignTag.execute(row.documentId, userId, tagId, { learnFromEmbedding: true });
        applied += 1;
        continue;
      }
      const reason = formatAssignRecommendationReason({
        tagName: tag.name,
        similarity: score.score,
        labelSupportCount: seedDocumentIds.length,
      });
      await this.taxonomy.upsertSuggestion(row.documentId, tagId, reason, {
        confidence: score.score,
        source: 'embedding',
        decisionTier: 'confirm',
      });
    }
    return applied;
  }
}
