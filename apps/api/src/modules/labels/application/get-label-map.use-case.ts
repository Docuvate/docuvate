// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelMapCoverageStatus,
  LabelMapEmptyReason,
  LabelMapPointDto,
  LabelMapResponseDto,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import {
  computeDocumentCoverage,
  summarizeCoverage,
  type TagCentroidRef,
} from '../domain/label-coverage.js';
import {
  computeCoverageSimilarity,
  type LabeledDocumentEmbedding,
} from '../domain/label-coverage-score.js';
import { projectLabelMap2D } from '../domain/label-map-projection.js';
import { buildLabelOverlapMatrix } from '../domain/label-overlap-matrix.js';
import { BackfillDocumentEmbeddingsUseCase } from './backfill-document-embeddings.use-case.js';

@Injectable()
export class GetLabelMapUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly backfillEmbeddings: BackfillDocumentEmbeddingsUseCase
  ) {}

  async execute(userId: string): Promise<LabelMapResponseDto> {
    const extractedDocumentCount = await this.labelEmbeddings.countExtractedDocumentsForMap(userId);
    let rows = await this.labelEmbeddings.listDocumentEmbeddingsForUser(userId);

    if (rows.length === 0 && extractedDocumentCount > 0) {
      await this.backfillEmbeddings.execute(userId);
      rows = await this.labelEmbeddings.listDocumentEmbeddingsForUser(userId);
    }

    const emptyReason = this.resolveEmptyReason(extractedDocumentCount, rows.length);
    if (rows.length === 0) {
      return {
        points: [],
        documentCount: 0,
        tagCount: 0,
        extractedDocumentCount,
        emptyReason,
      };
    }

    const [tags, centroids, preferences] = await Promise.all([
      this.taxonomy.listTags(userId),
      this.labelEmbeddings.getTagCentroids(userId),
      this.prefs.getForUser(userId),
    ]);
    const nearThreshold = preferences.labelNearSimilarityThreshold;

    const tagById = new Map(tags.map((t) => [t.id, t]));
    const docVectors = rows.map((r) => r.embedding);
    const tagCentroids = centroids.filter((c) => {
      const tag = tagById.get(c.tagId);
      return c.centroid.length > 0 && tag && !tag.isInbox;
    });
    const centroidVectors = tagCentroids.map((c) => c.centroid);

    const allVectors = [...docVectors, ...centroidVectors];
    if (allVectors.length === 0) {
      return {
        points: [],
        documentCount: 0,
        tagCount: 0,
        extractedDocumentCount,
        emptyReason: 'awaiting_embeddings',
      };
    }

    const { coords: plotCoords, method: projectionMethod } = projectLabelMap2D(allVectors);
    const docCoords = plotCoords.slice(0, docVectors.length);
    const tagCoords = plotCoords.slice(docVectors.length);

    const centroidRefs: TagCentroidRef[] = tagCentroids.map((c) => ({
      tagId: c.tagId,
      centroid: c.centroid,
    }));

    const labeledDocuments: LabeledDocumentEmbedding[] = rows
      .filter((r) => r.nonInboxTagIds.length > 0)
      .map((r) => ({
        embedding: r.embedding,
        nonInboxTagIds: r.nonInboxTagIds,
      }));

    const docEmbeddingsByTagId = new Map<string, number[][]>();
    for (const row of rows) {
      for (const tagId of row.nonInboxTagIds) {
        const bucket = docEmbeddingsByTagId.get(tagId) ?? [];
        bucket.push(row.embedding);
        docEmbeddingsByTagId.set(tagId, bucket);
      }
    }

    const coverageStatuses: LabelMapCoverageStatus[] = [];
    const points: LabelMapPointDto[] = [];

    rows.forEach((row, index) => {
      const [x, y] = docCoords[index] ?? [0.5, 0.5];
      const labelTags = row.nonInboxTagIds
        .map((id) => tagById.get(id))
        .filter((t): t is NonNullable<typeof t> => t != null)
        .map((t) => t.name);
      const coverage = computeDocumentCoverage(
        row.embedding,
        row.nonInboxTagIds,
        centroidRefs,
        nearThreshold
      );
      coverageStatuses.push(coverage.status);
      const nearestTag = coverage.nearestTagId ? tagById.get(coverage.nearestTagId) : undefined;
      const coverageScore = computeCoverageSimilarity(
        row.embedding,
        centroidRefs,
        labeledDocuments
      );
      points.push({
        id: `doc:${row.documentId}`,
        kind: 'document',
        documentId: row.documentId,
        x,
        y,
        label: row.title || row.filename,
        tagIds: row.nonInboxTagIds,
        tagNames: labelTags,
        unlabeled: row.nonInboxTagIds.length === 0,
        coverageStatus: coverage.status,
        bestAnySimilarity: coverage.bestAnySimilarity,
        bestAssignedSimilarity: coverage.bestAssignedSimilarity,
        nearestTagId: coverage.nearestTagId,
        nearestTagName: nearestTag?.name ?? null,
        coverageScore,
      });
    });

    tagCentroids.forEach((centroid, index) => {
      const tag = tagById.get(centroid.tagId);
      if (!tag) {
        return;
      }
      const [x, y] = tagCoords[index] ?? [0.5, 0.5];
      points.push({
        id: `tag:${centroid.tagId}`,
        kind: 'tag',
        tagId: centroid.tagId,
        x,
        y,
        label: tag.name,
        tagIds: [centroid.tagId],
        tagNames: [tag.name],
        sampleCount: centroid.sampleCount,
      });
    });

    const overlapTags = tagCentroids.map((c) => ({
      tagId: c.tagId,
      name: tagById.get(c.tagId)?.name ?? c.tagId,
      centroid: c.centroid,
      docEmbeddings: docEmbeddingsByTagId.get(c.tagId) ?? [],
    }));
    const overlap = buildLabelOverlapMatrix(overlapTags);

    return {
      points,
      documentCount: rows.length,
      tagCount: tagCentroids.length,
      extractedDocumentCount,
      emptyReason: null,
      coverageSummary: summarizeCoverage(coverageStatuses, nearThreshold),
      projectionMethod,
      overlap,
    };
  }

  private resolveEmptyReason(
    extractedDocumentCount: number,
    embeddedCount: number
  ): LabelMapEmptyReason | null {
    if (embeddedCount > 0) {
      return null;
    }
    if (extractedDocumentCount === 0) {
      return 'no_extracted_documents';
    }
    return 'embedding_unavailable';
  }
}
