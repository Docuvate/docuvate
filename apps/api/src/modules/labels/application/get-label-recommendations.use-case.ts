// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationDocumentPreviewDto,
  LabelRecommendationDto,
  LabelRecommendationListResponse,
  LabelRecommendationsLoadState,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { namesAreNearDuplicate, normalizeLabelKey } from '../../../shared/domain/label-name-similarity.js';
import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import type { TagCentroidRef } from '../domain/label-coverage.js';
import { type LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { suggestMergeAndRename } from '../domain/label-merge-rename-suggestions.js';
import { OPEN_SET_MIN_CLUSTER_SIZE } from '../domain/label-open-set-discovery.js';
import {
  buildExcludedDocumentsByLabelKey,
  filterClusterDocumentIds,
} from '../domain/label-recommendation-cluster-exclusions.js';
import { clusterDocumentSimilarities } from '../domain/label-recommendation-cluster-similarity.js';
import {
  MIN_LABEL_SUPPORT_FOR_MERGE,
  suggestAssignRecommendations,
  suggestEmbeddingClusterNewLabels,
  suggestEmbeddingMergeRecommendations,
} from '../domain/label-recommendation-scoring.js';
import { isBlockedLabelCandidate } from '../domain/recommendation-blocklist.js';
import { LabelHybridModelCacheService } from '../infrastructure/label-hybrid-model-cache.service.js';
import { PgLabelDocumentInventoryRepository } from '../infrastructure/pg-label-document-inventory.repository.js';

export interface GetLabelRecommendationsOptions {
  abortSignal?: AbortSignal;
}

function buildHybridTrainingRowsFromConfirmed(
  confirmedEmbeddingRows: Awaited<
    ReturnType<LabelEmbeddingRepository['listUserConfirmedDocumentEmbeddingsForUser']>
  >
): LabelHybridDocumentRow[] {
  return confirmedEmbeddingRows.map((row) => ({
    documentId: row.documentId,
    embedding: row.embedding,
    nonInboxTagIds: row.nonInboxTagIds,
    text: `${row.title}\n${row.filename}`.slice(0, 12000),
  }));
}

function warmingResponse(): LabelRecommendationListResponse {
  return { items: [], state: 'warming' };
}

function enrichWithSampleDocuments(
  items: LabelRecommendationDto[],
  previews: ReadonlyMap<string, LabelRecommendationDocumentPreviewDto>,
  embeddingByDocumentId: ReadonlyMap<string, number[]>
): LabelRecommendationDto[] {
  return items.map((item) => {
    const ids = item.sampleDocumentIds ?? [];
    if (ids.length === 0) {
      return item;
    }
    const similarities =
      item.kind === 'new'
        ? clusterDocumentSimilarities(ids, embeddingByDocumentId)
        : new Map<string, number>();
    const sampleDocuments: LabelRecommendationDocumentPreviewDto[] = [];
    for (const id of ids) {
      const preview = previews.get(id);
      if (!preview) {
        continue;
      }
      const similarity = similarities.get(id);
      sampleDocuments.push(
        similarity !== undefined ? { ...preview, similarity } : preview
      );
    }
    return sampleDocuments.length > 0 ? { ...item, sampleDocuments } : item;
  });
}

function labelNameConflictsExisting(name: string, existingNames: string[]): boolean {
  return existingNames.some((existing) => namesAreNearDuplicate(existing, name));
}

@Injectable()
export class GetLabelRecommendationsUseCase {
  constructor(
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    @Inject(LabelHybridModelCacheService)
    private readonly labelHybridCache: LabelHybridModelCacheService,
    private readonly inventoryRepo: PgLabelDocumentInventoryRepository
  ) {}

  async execute(
    userId: string,
    options?: GetLabelRecommendationsOptions
  ): Promise<LabelRecommendationListResponse> {
    const confirmedEmbeddingRows =
      await this.labelEmbeddings.listUserConfirmedDocumentEmbeddingsForUser(userId);
    if (options?.abortSignal?.aborted) {
      return warmingResponse();
    }

    const hybridTrainingRowsPreview = confirmedEmbeddingRows.map((row) => ({
      documentId: row.documentId,
      embedding: row.embedding,
      nonInboxTagIds: row.nonInboxTagIds,
      text: `${row.title}\n${row.filename}`,
    }));
    if (this.labelHybridCache.shouldReturnWarmingResponse(userId, hybridTrainingRowsPreview)) {
      this.labelHybridCache.scheduleHybridWarm(userId, hybridTrainingRowsPreview);
      return warmingResponse();
    }

    const [
      tags,
      centroids,
      dismissed,
      blocklist,
      blockPatterns,
      embeddingRows,
      preferences,
      clusterExclusions,
    ] = await Promise.all([
      this.taxonomy.listTags(userId),
      this.labelEmbeddings.getTagCentroids(userId),
      this.labelEmbeddings.listDismissedRecommendationKeys(userId),
      this.labelEmbeddings.listRecommendationBlocklist(userId),
      this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
      this.labelEmbeddings.listDocumentEmbeddingsForUser(userId),
      this.prefs.getForUser(userId),
      this.labelEmbeddings.listClusterDocumentExclusions(userId),
    ]);
    if (options?.abortSignal?.aborted) {
      return warmingResponse();
    }
    const excludedByLabelKey = buildExcludedDocumentsByLabelKey(clusterExclusions);
    const embeddingByDocumentId = new Map(
      embeddingRows.map((row) => [row.documentId, row.embedding] as const)
    );
    const dismissedKeys = new Set(dismissed);
    const blockPhrases = blocklist.map((b) => b.phrase);
    const patternStrings = blockPatterns.map((p) => p.pattern);
    const nonInboxTags = tags.filter((t) => !t.isInbox);
    const existingTagNames = nonInboxTags.map((t) => t.name);
    const threshold = preferences.labelNearSimilarityThreshold;

    const tagNameById = new Map(nonInboxTags.map((t) => [t.id, t.name]));
    const centroidByTag = new Map(centroids.map((c) => [c.tagId, c.centroid]));
    const centroidRefs: TagCentroidRef[] = centroids
      .filter((c) => c.centroid.length > 0 && tagNameById.has(c.tagId))
      .map((c) => ({ tagId: c.tagId, centroid: c.centroid }));

    const docEmbeddingsByTagId = new Map<string, number[][]>();
    for (const row of embeddingRows) {
      for (const tagId of row.nonInboxTagIds) {
        if (!tagNameById.has(tagId)) {
          continue;
        }
        const list = docEmbeddingsByTagId.get(tagId) ?? [];
        list.push(row.embedding);
        docEmbeddingsByTagId.set(tagId, list);
      }
    }

    const items: LabelRecommendationDto[] = [];

    const labelSupportCountByTagId = new Map<string, number>();
    for (const [tagId, embeddings] of docEmbeddingsByTagId) {
      labelSupportCountByTagId.set(tagId, embeddings.length);
    }

    const hybridTrainingRows = buildHybridTrainingRowsFromConfirmed(confirmedEmbeddingRows);
    this.labelHybridCache.scheduleHybridWarm(userId, hybridTrainingRows);
    if (this.labelHybridCache.shouldReturnWarmingResponse(userId, hybridTrainingRows)) {
      return warmingResponse();
    }
    const hybridModel = this.labelHybridCache.resolveModelForInference(userId, hybridTrainingRows);

    const assignRows = suggestAssignRecommendations({
      rows: hybridTrainingRows,
      centroids: centroidRefs,
      tagNameById,
      labelSupportCountByTagId,
      threshold,
      dismissedKeys,
      hybridModel,
    });
    const assignDocIds = new Set(assignRows.map((r) => r.documentId));

    for (const row of assignRows) {
      items.push({
        id: row.id,
        kind: 'assign',
        tagId: row.tagId,
        tagNames: [row.tagName],
        nearestTagName: row.tagName,
        score: row.score,
        similarity: row.similarity,
        source: 'embedding',
        reason: row.reason,
        sampleDocumentIds: [row.documentId],
      });
    }

    const embeddingMerges = suggestEmbeddingMergeRecommendations({
      tags: nonInboxTags.map((t) => ({
        tagId: t.id,
        name: t.name,
        centroid: centroidByTag.get(t.id) ?? [],
      })),
      docEmbeddingsByTagId,
      dismissedKeys,
      nameNearDuplicate: namesAreNearDuplicate,
    });

    const mergeTagIds = new Set<string>();
    for (const suggestion of embeddingMerges) {
      for (const tagId of suggestion.tagIds) {
        mergeTagIds.add(tagId);
      }
      items.push({
        id: suggestion.id,
        kind: 'merge',
        tagIds: suggestion.tagIds,
        tagNames: suggestion.names,
        score: suggestion.score,
        similarity: suggestion.similarity,
        source: 'embedding',
        reason: suggestion.reason,
      });
    }

    const clusterNew = suggestEmbeddingClusterNewLabels({
      rows: embeddingRows.map((row) => ({
        documentId: row.documentId,
        embedding: row.embedding,
        nonInboxTagIds: row.nonInboxTagIds,
        title: row.title,
        filename: row.filename,
        text: '',
        fields: [],
      })),
      centroids: centroidRefs,
      threshold,
      dismissedKeys,
    });

    const clusterDocIds = new Set(clusterNew.flatMap((c) => c.documentIds));

    for (const cluster of clusterNew) {
      const labelKey = normalizeLabelKey(cluster.proposedName);
      const documentIds = filterClusterDocumentIds(
        cluster.documentIds,
        labelKey,
        excludedByLabelKey
      );
      if (documentIds.length < OPEN_SET_MIN_CLUSTER_SIZE) {
        continue;
      }
      if (assignDocIds.has(documentIds[0] ?? '')) {
        continue;
      }
      if (labelNameConflictsExisting(cluster.proposedName, existingTagNames)) {
        continue;
      }
      items.push({
        id: cluster.id,
        kind: 'new',
        proposedName: cluster.proposedName,
        score: cluster.score,
        similarity: cluster.similarity,
        source: 'embedding',
        reason: cluster.reason,
        sampleDocumentIds: documentIds,
      });
    }

    const mergeRename = suggestMergeAndRename(
      nonInboxTags.map((t) => ({
        tagId: t.id,
        name: t.name,
        centroid: centroidByTag.get(t.id) ?? [],
      })),
      dismissedKeys
    );

    for (const suggestion of mergeRename) {
      if (suggestion.kind === 'merge') {
        if (items.some((i) => i.kind === 'merge' && i.id === suggestion.id)) {
          continue;
        }
        items.push({
          id: suggestion.id,
          kind: 'merge',
          tagIds: suggestion.tagIds,
          tagNames: suggestion.names,
          score: suggestion.score,
          reason: suggestion.reason,
        });
      } else {
        items.push({
          id: suggestion.id,
          kind: 'rename',
          tagId: suggestion.tagId,
          proposedName: suggestion.toName,
          currentName: suggestion.fromName,
          score: suggestion.score,
          reason: suggestion.reason,
        });
      }
    }

    const filtered = items.filter((item) => {
      if (item.kind === 'new' && item.proposedName) {
        if (labelNameConflictsExisting(item.proposedName, existingTagNames)) {
          return false;
        }
        return !isBlockedLabelCandidate(item.proposedName, blockPhrases, patternStrings);
      }
      if (item.kind === 'rename') {
        if (item.currentName?.trim() === item.proposedName?.trim()) {
          return false;
        }
        if (item.proposedName) {
          return !isBlockedLabelCandidate(item.proposedName, blockPhrases, patternStrings);
        }
      }
      if (item.kind === 'merge' && item.tagNames) {
        if (
          item.tagNames.length >= 2 &&
          !namesAreNearDuplicate(item.tagNames[0], item.tagNames[1])
        ) {
          return false;
        }
        if (item.tagIds?.length === 2) {
          const aCount = docEmbeddingsByTagId.get(item.tagIds[0])?.length ?? 0;
          const bCount = docEmbeddingsByTagId.get(item.tagIds[1])?.length ?? 0;
          if (aCount < MIN_LABEL_SUPPORT_FOR_MERGE || bCount < MIN_LABEL_SUPPORT_FOR_MERGE) {
            return false;
          }
        }
        return !item.tagNames.some((name) =>
          isBlockedLabelCandidate(name, blockPhrases, patternStrings)
        );
      }
      return true;
    });

    const newSuggestionsByDoc = new Map<string, LabelRecommendationDto>();
    for (const item of filtered) {
      if (item.kind !== 'new') {
        continue;
      }
      for (const docId of item.sampleDocumentIds ?? []) {
        if (assignDocIds.has(docId) || !clusterDocIds.has(docId)) {
          continue;
        }
        const existing = newSuggestionsByDoc.get(docId);
        if (!existing || item.score > existing.score) {
          newSuggestionsByDoc.set(docId, item);
        }
      }
    }
    const allowedNewIds = new Set([...newSuggestionsByDoc.values()].map((item) => item.id));

    const dedupedNew = filtered.filter(
      (item) => item.kind !== 'new' || allowedNewIds.has(item.id)
    );

    const sorted = dedupedNew.sort((a, b) => b.score - a.score).slice(0, 8);

    for (const item of sorted) {
      if (item.kind !== 'merge' || !item.tagIds?.length) {
        continue;
      }
      for (const tagId of item.tagIds) {
        mergeTagIds.add(tagId);
      }
    }

    const mergeSamples = await this.inventoryRepo.loadSampleDocumentIdsByTag(
      userId,
      [...mergeTagIds],
      2
    );
    for (const item of sorted) {
      if (item.kind !== 'merge' || !item.tagIds?.length) {
        continue;
      }
      const sampleIds: string[] = [];
      for (const tagId of item.tagIds) {
        for (const docId of mergeSamples.get(tagId) ?? []) {
          if (!sampleIds.includes(docId)) {
            sampleIds.push(docId);
          }
        }
      }
      if (sampleIds.length > 0) {
        item.sampleDocumentIds = sampleIds.slice(0, 4);
      }
    }

    const previewIds = new Set<string>();
    for (const item of sorted) {
      for (const id of item.sampleDocumentIds ?? []) {
        previewIds.add(id);
      }
    }
    const previews = await this.inventoryRepo.loadDocumentPreviewsByIds(userId, [...previewIds]);
    const enrichedItems = enrichWithSampleDocuments(sorted, previews, embeddingByDocumentId);
    const state: LabelRecommendationsLoadState = 'ready';
    return { items: enrichedItems, state };
  }
}
