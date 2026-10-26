// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationDocumentPreviewDto,
  LabelRecommendationDto,
} from '@docuvate/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { clusterDocumentSimilarities } from '../domain/label-recommendation-cluster-similarity.js';
import { LabelHybridModelCacheService } from '../infrastructure/label-hybrid-model-cache.service.js';

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

  it('resolveModel awaits in-flight hybrid training (blocking inference)', async () => {
    process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'] = '0';
    const stubModel: LabelHybridModel = {
      tagIds: ['a'],
      vocabulary: ['x'],
      idf: [1],
      weightRows: [[1]],
      embedDim: 2,
      confidenceThreshold: 0.9,
      classGates: [],
    };
    let resolveTrain: ((model: LabelHybridModel | null) => void) | undefined;
    const train = vi.fn((): Promise<LabelHybridModel | null> => {
      return new Promise((resolve) => {
        resolveTrain = resolve;
      });
    });
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const rows: LabelHybridDocumentRow[] = [
      {
        documentId: 'd1',
        embedding: [0.1, 0.2],
        nonInboxTagIds: ['tag-a'],
        text: 'confirmed label training row',
      },
    ];
    const userId = 'user-blocking';

    const pending = cache.resolveModel(userId, rows);
    await vi.waitFor(() => {
      expect(train).toHaveBeenCalled();
    });

    const blocked = Promise.race([
      pending,
      new Promise<null>((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 150);
      }),
    ]);
    const result = await blocked;
    expect(result).toBeNull();
    resolveTrain?.(stubModel);
    delete process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'];
  });
});
