// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type {
  AcceptLabelRecommendationRequest,
  DismissLabelRecommendationRequest,
} from '@docuvate/contracts';
import {
  LABEL_EMBEDDING_REPOSITORY,
  TAXONOMY_REPOSITORY,
  USER_PREFERENCES_REPOSITORY,
  type LabelEmbeddingRepository,
  type TaxonomyRepository,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { assertTagNameNotNearDuplicate } from '../../../shared/domain/tag-name-uniqueness.js';
import { normalizeLabelKey } from '../domain/label-vocabulary.js';
import { phraseFromRecommendationKey } from '../domain/recommendation-blocklist.js';
import { AssignDocumentTagUseCase } from './document-label.use-cases.js';
import { adjustLabelNearThresholdFromFeedback } from '../domain/label-near-threshold.js';
import { parseAssignRecommendationId } from '../domain/label-recommendation-scoring.js';
import { cosineSimilarity } from '../domain/cosine.js';

@Injectable()
export class DismissLabelRecommendationUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(
    userId: string,
    recommendationId: string,
    options: DismissLabelRecommendationRequest = {}
  ): Promise<void> {
    await this.labelEmbeddings.dismissRecommendation(userId, recommendationId);
    await this.learnFromAssignDismiss(userId, recommendationId);

    if (options.blockFuture !== true) {
      return;
    }
    const fromList = (options.phrases ?? []).map((p) => p.trim()).filter((p) => p.length >= 2);
    const single = options.phrase?.trim() || phraseFromRecommendationKey(recommendationId) || '';
    const phrases = [...new Set(single.length >= 2 ? [...fromList, single] : fromList)];
    for (const phrase of phrases) {
      await this.labelEmbeddings.addRecommendationBlocklist(userId, phrase, 'dismiss');
    }
  }

  private async learnFromAssignDismiss(userId: string, recommendationId: string): Promise<void> {
    const parsed = parseAssignRecommendationId(recommendationId);
    if (!parsed) {
      return;
    }
    const similarity = await this.resolveAssignSimilarity(userId, parsed.documentId, parsed.tagId);
    if (similarity == null) {
      return;
    }
    const prefs = await this.prefs.getForUser(userId);
    const next = adjustLabelNearThresholdFromFeedback(
      prefs.labelNearSimilarityThreshold,
      similarity,
      'dismiss'
    );
    await this.prefs.upsert(userId, { labelNearSimilarityThreshold: next });
  }

  private async resolveAssignSimilarity(
    userId: string,
    documentId: string,
    tagId: string
  ): Promise<number | null> {
    const [rows, centroids] = await Promise.all([
      this.labelEmbeddings.listDocumentEmbeddingsForUser(userId),
      this.labelEmbeddings.getTagCentroids(userId),
    ]);
    const row = rows.find((r) => r.documentId === documentId);
    const centroid = centroids.find((c) => c.tagId === tagId)?.centroid;
    if (!row || !centroid || row.embedding.length === 0 || centroid.length === 0) {
      return null;
    }
    return cosineSimilarity(row.embedding, centroid);
  }
}

@Injectable()
export class AcceptLabelRecommendationUseCase {
  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly assignTag: AssignDocumentTagUseCase
  ) {}

  async execute(userId: string, body: AcceptLabelRecommendationRequest) {
    const id = body.recommendationId.trim();
    if (!id) {
      throw new ValidationError('recommendationId is required');
    }

    if (id.startsWith('assign:')) {
      const parsed = parseAssignRecommendationId(id);
      if (!parsed) {
        throw new ValidationError('Invalid assign recommendation id');
      }
      const tagId = body.tagId ?? parsed.tagId;
      await this.assignTag.execute(parsed.documentId, userId, tagId, { learnFromEmbedding: true });
      await this.learnFromAssignAccept(userId, parsed.documentId, tagId);
      await this.labelEmbeddings.dismissRecommendation(userId, id);
      return { tagId, action: 'assigned' as const, documentId: parsed.documentId };
    }

    if (id.startsWith('new:')) {
      const name = body.proposedName?.trim() ?? (id.startsWith('new:cluster:') ? '' : id.slice(4));
      if (!name || name.length < 2) {
        throw new ValidationError('Label name is required');
      }
      const existingTags = await this.taxonomy.listTags(userId);
      assertTagNameNotNearDuplicate(name, existingTags);
      const tag = await this.taxonomy.createTag(userId, name, {
        color: body.color ?? '#64748b',
        matchingAlgorithm: 'any',
        match: name,
      });
      const docIds = (body.documentIds ?? []).filter((d) => d.trim().length > 0);
      if (id.startsWith('new:cluster:') && docIds.length > 0) {
        for (const documentId of docIds) {
          await this.assignTag.execute(documentId, userId, tag.id, { learnFromEmbedding: true });
        }
      }
      await this.labelEmbeddings.dismissRecommendation(userId, id);
      await this.labelEmbeddings.dismissRecommendation(userId, `new:${normalizeLabelKey(name)}`);
      return { tagId: tag.id, action: 'created' as const };
    }

    if (id.startsWith('merge:')) {
      const parts = id.split(':');
      const keepTagId = body.keepTagId ?? parts[1];
      const removeTagId = body.removeTagId ?? parts[2];
      if (!keepTagId || !removeTagId) {
        throw new ValidationError('keepTagId and removeTagId are required for merge');
      }
      await this.taxonomy.mergeTags(userId, keepTagId, removeTagId);
      await this.labelEmbeddings.dismissRecommendation(userId, id);
      return { tagId: keepTagId, action: 'merged' as const };
    }

    if (id.startsWith('rename:')) {
      const tagId = body.tagId ?? id.split(':')[1];
      const proposedName = body.proposedName?.trim();
      if (!tagId || !proposedName) {
        throw new ValidationError('tagId and proposedName are required for rename');
      }
      const existing = await this.taxonomy.findTagByIdForUser(tagId, userId);
      if (!existing) {
        throw new NotFoundError('Tag');
      }
      const allTags = await this.taxonomy.listTags(userId);
      assertTagNameNotNearDuplicate(proposedName, allTags, tagId);
      const tag = await this.taxonomy.updateTag(tagId, userId, { name: proposedName });
      await this.labelEmbeddings.dismissRecommendation(userId, id);
      return { tagId: tag.id, action: 'renamed' as const };
    }

    throw new ValidationError('Unknown recommendation id');
  }

  private async learnFromAssignAccept(
    userId: string,
    documentId: string,
    tagId: string
  ): Promise<void> {
    const [rows, centroids, prefs] = await Promise.all([
      this.labelEmbeddings.listDocumentEmbeddingsForUser(userId),
      this.labelEmbeddings.getTagCentroids(userId),
      this.prefs.getForUser(userId),
    ]);
    const row = rows.find((r) => r.documentId === documentId);
    const centroid = centroids.find((c) => c.tagId === tagId)?.centroid;
    if (!row || !centroid || row.embedding.length === 0 || centroid.length === 0) {
      return;
    }
    const similarity = cosineSimilarity(row.embedding, centroid);
    const next = adjustLabelNearThresholdFromFeedback(
      prefs.labelNearSimilarityThreshold,
      similarity,
      'accept'
    );
    await this.prefs.upsert(userId, { labelNearSimilarityThreshold: next });
  }
}
