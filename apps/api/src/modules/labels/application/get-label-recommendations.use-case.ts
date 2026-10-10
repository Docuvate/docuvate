// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationDocumentPreviewDto,
  LabelRecommendationDto,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

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
import type { TagCentroidRef } from '../domain/label-coverage.js';
import {
  MIN_LABEL_SUPPORT_FOR_MERGE,
  suggestAssignRecommendations,
  suggestEmbeddingClusterNewLabels,
  suggestEmbeddingMergeRecommendations,
} from '../domain/label-recommendation-scoring.js';
import {
  collectNewLabelCandidates,
  type DocumentLabelSignal,
  namesAreNearDuplicate,
  normalizeLabelKey,
  suggestMergeAndRename,
} from '../domain/label-vocabulary.js';
import { isBlockedLabelCandidate } from '../domain/recommendation-blocklist.js';

function enrichWithSampleDocuments(
  items: LabelRecommendationDto[],
  docs: DocumentEntity[]
): LabelRecommendationDto[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  return items.map((item) => {
    const ids = item.sampleDocumentIds ?? [];
    if (ids.length === 0) {
      return item;
    }
    const sampleDocuments: LabelRecommendationDocumentPreviewDto[] = [];
    for (const id of ids) {
      const doc = byId.get(id);
      if (!doc) {
        continue;
      }
      sampleDocuments.push({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        status: doc.status,
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
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(userId: string): Promise<LabelRecommendationDto[]> {
    const [tags, docs, centroids, dismissed, blocklist, blockPatterns, embeddingRows, preferences] =
      await Promise.all([
        this.taxonomy.listTags(userId),
        this.documents.listForUser(userId, { status: 'ready' }),
        this.labelEmbeddings.getTagCentroids(userId),
        this.labelEmbeddings.listDismissedRecommendationKeys(userId),
        this.labelEmbeddings.listRecommendationBlocklist(userId),
        this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
        this.labelEmbeddings.listDocumentEmbeddingsForUser(userId),
        this.prefs.getForUser(userId),
      ]);
    const dismissedKeys = new Set(dismissed);
    const blockPhrases = blocklist.map((b) => b.phrase);
    const patternStrings = blockPatterns.map((p) => p.pattern);
    const nonInboxTags = tags.filter((t) => !t.isInbox);
    const existingTagNames = nonInboxTags.map((t) => t.name);
    const threshold = preferences.labelNearSimilarityThreshold;

    const signals: DocumentLabelSignal[] = docs.map((doc) => ({
      documentId: doc.id,
      title: doc.title,
      filename: doc.filename,
      text: doc.extraction?.text ?? '',
      fields: doc.extraction?.fields ?? [],
      nonInboxTagIds: doc.tags.filter((t) => !t.isInbox).map((t) => t.id),
    }));

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

    const assignRows = suggestAssignRecommendations({
      rows: embeddingRows,
      centroids: centroidRefs,
      tagNameById,
      labelSupportCountByTagId,
      threshold,
      dismissedKeys,
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
        const text = doc?.extraction?.text ?? '';
        return {
          documentId: row.documentId,
          embedding: row.embedding,
          nonInboxTagIds: row.nonInboxTagIds,
          textSnippet: `${doc?.title ?? ''} ${doc?.filename ?? ''} ${text}`.slice(0, 8000),
        };
      }),
      centroids: centroidRefs,
      threshold,
      dismissedKeys,
    });

    const clusterDocIds = new Set(clusterNew.flatMap((c) => c.documentIds));

    for (const cluster of clusterNew) {
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
        sampleDocumentIds: cluster.documentIds,
      });
    }

    const textSignals = signals.filter(
      (s) =>
        !assignDocIds.has(s.documentId) &&
        !clusterDocIds.has(s.documentId) &&
        s.nonInboxTagIds.length === 0
    );
    const newCandidates = collectNewLabelCandidates(
      textSignals,
      tags.map((t) => t.name),
      dismissedKeys,
      blockPhrases,
      patternStrings
    );

    const mergeRename = suggestMergeAndRename(
      nonInboxTags.map((t) => ({
        tagId: t.id,
        name: t.name,
        centroid: centroidByTag.get(t.id) ?? [],
      })),
      dismissedKeys
    );

    for (const candidate of newCandidates) {
      items.push({
        id: `new:${normalizeLabelKey(candidate.name)}`,
        kind: 'new',
        proposedName: candidate.name,
        score: candidate.score,
        source: 'text',
        reason: candidate.reason,
        sampleDocumentIds: candidate.documentIds,
      });
    }

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

    const sorted = filtered.sort((a, b) => b.score - a.score).slice(0, 8);
    return enrichWithSampleDocuments(sorted, docs);
  }
}
