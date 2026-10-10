// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  EMBEDDING_PORT,
  LABEL_EMBEDDING_REPOSITORY,
  TAXONOMY_REPOSITORY,
  USER_PREFERENCES_REPOSITORY,
  type DocumentRepository,
  type EmbeddingPort,
  type LabelEmbeddingRepository,
  type TaxonomyRepository,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { cosineSimilarity } from '../domain/cosine.js';
import { ApplyEmbeddingDensitySuggestionsUseCase } from './apply-embedding-density-suggestions.use-case.js';
import { EmbeddingDensityCalibrationQueueService } from '../infrastructure/embedding-density-calibration-queue.service.js';
import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';

const MAX_SUGGESTIONS = 5;
const REJECT_PENALTY = 0.04;

@Injectable()
export class ApplyEmbeddingSuggestionsUseCase {
  private readonly logger = new Logger(ApplyEmbeddingSuggestionsUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(EMBEDDING_PORT) private readonly embedding: EmbeddingPort,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly embeddingDensity: ApplyEmbeddingDensitySuggestionsUseCase,
    private readonly densityCalibrationQueue: EmbeddingDensityCalibrationQueueService
  ) {}

  async execute(documentId: string, userId: string, content: string): Promise<void> {
    const trimmed = content.trim();
    if (trimmed.length < 20) {
      return;
    }

    try {
      const minConfidence = (await this.prefs.getForUser(userId)).labelNearSimilarityThreshold;

      const { model, embeddings } = await this.embedding.embedTexts([trimmed]);
      const vector = embeddings[0];
      if (!vector || vector.length === 0) {
        return;
      }

      await this.labelEmbeddings.saveDocumentEmbedding(documentId, userId, model, vector);

      if (embeddingDensityGloballyEnabled()) {
        void this.densityCalibrationQueue.scheduleUserCalibration(userId);
      }

      const usedDensity = await this.embeddingDensity.tryApply(documentId, userId, vector);
      if (usedDensity) {
        return;
      }

      const assigned = new Set(
        (await this.taxonomy.listTagsForDocument(documentId)).map((t) => t.id)
      );
      const existingSuggestions = await this.taxonomy.listSuggestions(documentId, userId);
      const ruleTags = new Set(
        existingSuggestions.filter((s) => s.source !== 'embedding').map((s) => s.tag.id)
      );

      const references = await this.labelEmbeddings.listLabeledDocumentEmbeddings(
        userId,
        documentId
      );
      const centroids = await this.labelEmbeddings.getTagCentroids(userId);
      const tags = await this.taxonomy.listTags(userId);
      const tagById = new Map(tags.map((t) => [t.id, t]));

      const scores = new Map<string, number>();

      for (const ref of references) {
        const sim = cosineSimilarity(vector, ref.embedding);
        for (const tagId of ref.tagIds) {
          if (assigned.has(tagId)) {
            continue;
          }
          const tag = tagById.get(tagId);
          if (!tag || tag.isInbox) {
            continue;
          }
          const prev = scores.get(tagId) ?? 0;
          scores.set(tagId, Math.max(prev, sim));
        }
      }

      for (const centroid of centroids) {
        if (assigned.has(centroid.tagId) || centroid.centroid.length === 0) {
          continue;
        }
        const tag = tagById.get(centroid.tagId);
        if (!tag || tag.isInbox) {
          continue;
        }
        const sim = cosineSimilarity(vector, centroid.centroid);
        const prev = scores.get(centroid.tagId) ?? 0;
        scores.set(centroid.tagId, Math.max(prev, sim));
      }

      const ranked = [...scores.entries()]
        .map(([tagId, score]) => ({ tagId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SUGGESTIONS);

      for (const { tagId, score } of ranked) {
        if (score < minConfidence) {
          continue;
        }
        if (ruleTags.has(tagId)) {
          continue;
        }
        const rejections = await this.labelEmbeddings.countRejectionsForTag(userId, tagId);
        const adjusted = Math.max(0, score - rejections * REJECT_PENALTY);
        if (adjusted < minConfidence) {
          continue;
        }
        const tag = tagById.get(tagId);
        if (!tag) {
          continue;
        }
        const pct = Math.round(adjusted * 100);
        await this.taxonomy.upsertSuggestion(
          documentId,
          tagId,
          `Embedding-Ähnlichkeit ${pct}% (${tag.name})`,
          { source: 'embedding', confidence: adjusted }
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding suggestions skipped for ${documentId}: ${message}`);
    }
  }
}
