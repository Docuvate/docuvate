// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationDocumentPreviewDto,
  LabelRecommendationDto,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import { clusterDocumentSimilarities } from '../domain/label-recommendation-cluster-similarity.js';

/** Sample preview enrichment before formatDocumentDatePreview (F11). */
function unfixedEnrichWithSampleDocuments(
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
        documentDate: doc.documentDate
          ? doc.documentDate.toISOString().slice(0, 10)
          : null,
        similarity,
      });
    }
    return sampleDocuments.length > 0 ? { ...item, sampleDocuments } : item;
  });
}

describe('GET /labels/recommendations pre-fix regressions (documented)', () => {
  it('unfixed enrichment throws RangeError: Invalid time value for invalid documentDate', () => {
    const invalidDate = new Date('not-a-valid-date');
    expect(Number.isNaN(invalidDate.getTime())).toBe(true);

    const items: LabelRecommendationDto[] = [
      {
        id: 'new:cluster:audit',
        kind: 'new',
        proposedName: 'Audit cluster',
        score: 0.9,
        reason: 'audit seed cluster',
        sampleDocumentIds: ['doc-invalid-date'],
      },
    ];
    const docs: DocumentEntity[] = [
      {
        id: 'doc-invalid-date',
        userId: 'user-1',
        filename: 'bad.pdf',
        title: 'Bad date doc',
        mimeType: 'application/pdf',
        fileSizeBytes: 0,
        storageKey: 'k',
        status: 'ready',
        documentDate: invalidDate,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let message = '';
    try {
      unfixedEnrichWithSampleDocuments(items, docs, new Map());
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toBe('Invalid time value');
  });

});
