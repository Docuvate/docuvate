// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationDocumentPreviewDto,
  LabelRecommendationDto,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { namesAreNearDuplicate, normalizeLabelKey } from '../../../shared/domain/label-name-similarity.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import { formatDocumentDatePreview } from '../domain/format-document-date-preview.js';
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

function enrichWithSampleDocuments(
  items: LabelRecommendationDto[],
  docs: DocumentEntity[],
  embeddingByDocumentId: ReadonlyMap<string, number[]>
): LabelRecommendationDto[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
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
      const doc = byId.get(id);
      if (!doc) {
        continue;
      }
      const similarity = similarities.get(id);
      sampleDocuments.push({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        status: doc.status,
        documentDate: formatDocumentDatePreview(doc.documentDate),
        similarity,
      });
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
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly labelHybridCache: LabelHybridModelCacheService
  ) {}

  async execute(userId: string): Promise<LabelRecommendationDto[]> {
    const [
      tags,
      docs,
      centroids,
      dismissed,
      blocklist,
      blockPatterns,
      embeddingRows,
      confirmedEmbeddingRows,
      preferences,
      clusterExclusions,
    ] = await Promise.all([
      this.taxonomy.listTags(userId),
      this.documents.listForUser(userId, { status: 'ready' }),
      this.labelEmbeddings.getTagCentroids(userId),
      this.labelEmbeddings.listDismissedRecommendationKeys(userId),
      this.labelEmbeddings.listRecommendationBlocklist(userId),
      this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
      this.labelEmbeddings.listDocumentEmbeddingsForUser(userId),
      this.labelEmbeddings.listUserConfirmedDocumentEmbeddingsForUser(userId),
      this.prefs.getForUser(userId),
      this.labelEmbeddings.listClusterDocumentExclusions(userId),
    ]);
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

    const hybridTrainingRows: LabelHybridDocumentRow[] = confirmedEmbeddingRows.map((row) => {
      const doc = docs.find((d) => d.id === row.documentId);
      const text = doc
        ? `${doc.title}\n${doc.filename}\n${doc.extraction?.text ?? ''}`.slice(0, 12000)
        : `${row.title}\n${row.filename}`;
      return {
        documentId: row.documentId,
        embedding: row.embedding,
        nonInboxTagIds: row.nonInboxTagIds,
        text,
      };
    });
    const hybridModel = this.labelHybridCache.resolveModelForInference(
      userId,
      hybridTrainingRows
    );

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

    for (const suggestion of embeddingMerges) {
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
      rows: embeddingRows.map((row) => {
        const doc = docs.find((d) => d.id === row.documentId);
        return {
          documentId: row.documentId,
          embedding: row.embedding,
          nonInboxTagIds: row.nonInboxTagIds,
          title: doc?.title ?? row.title,
          filename: doc?.filename ?? row.filename,
          text: doc?.extraction?.text ?? '',
          fields: doc?.extraction?.fields ?? [],
        };
      }),
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
    return enrichWithSampleDocuments(sorted, docs, embeddingByDocumentId);
  }
}
