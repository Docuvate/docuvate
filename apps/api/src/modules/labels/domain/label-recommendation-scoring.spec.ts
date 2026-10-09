// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import {
  formatAssignRecommendationReason,
  formatMergeRecommendationReason,
  MIN_LABEL_SUPPORT_FOR_MERGE,
  scoreLabelPairForMerge,
  similarityDisplayTier,
  suggestAssignRecommendations,
  suggestEmbeddingMergeRecommendations,
} from './label-recommendation-scoring.js';

describe('similarity display', () => {
  it('uses qualitative tiers when label support is thin', () => {
    expect(
      formatAssignRecommendationReason({
        tagName: 'Bilanz',
        similarity: 0.99,
        labelSupportCount: 1,
      })
    ).toContain('hohe');
    expect(
      formatAssignRecommendationReason({
        tagName: 'Bilanz',
        similarity: 0.99,
        labelSupportCount: 1,
      })
    ).not.toContain('100');
  });

  it('shows capped percent when enough documents support the label', () => {
    const reason = formatAssignRecommendationReason({
      tagName: 'Bilanz',
      similarity: 0.991,
      labelSupportCount: MIN_LABEL_SUPPORT_FOR_MERGE,
    });
    expect(reason).toMatch(/99 %/);
  });

  it('classifies similarity tiers', () => {
    expect(similarityDisplayTier(0.85)).toBe('high');
    expect(similarityDisplayTier(0.7)).toBe('medium');
    expect(similarityDisplayTier(0.5)).toBe('low');
  });

  it('avoids percent merge reasons on thin support', () => {
    const reason = formatMergeRecommendationReason({
      nameA: 'Rechnung',
      nameB: 'Rechnungen',
      similarity: 0.7,
      supportCount: 2,
    });
    expect(reason).toContain('mittlere');
    expect(reason).not.toContain('100');
  });
});

describe('suggestAssignRecommendations', () => {
  const centroids = [{ tagId: 'vertrag', centroid: [1, 0, 0] }];

  it('recommends assign when unlabeled doc is near a centroid', () => {
    const rows = [
      {
        documentId: 'd1',
        embedding: [0.95, 0.05, 0],
        nonInboxTagIds: [] as string[],
      },
    ];
    const recs = suggestAssignRecommendations({
      rows,
      centroids,
      tagNameById: new Map([['vertrag', 'Vertrag']]),
      labelSupportCountByTagId: new Map([['vertrag', 3]]),
      threshold: 0.62,
      dismissedKeys: new Set(),
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]?.tagId).toBe('vertrag');
    expect(recs[0]?.similarity).toBeGreaterThanOrEqual(0.62);
  });

  it('skips dismissed assign ids', () => {
    const rows = [
      {
        documentId: 'd1',
        embedding: [0.95, 0.05, 0],
        nonInboxTagIds: [] as string[],
      },
    ];
    const recs = suggestAssignRecommendations({
      rows,
      centroids,
      tagNameById: new Map([['vertrag', 'Vertrag']]),
      labelSupportCountByTagId: new Map([['vertrag', 3]]),
      threshold: 0.62,
      dismissedKeys: new Set(['assign:d1:vertrag']),
    });
    expect(recs).toHaveLength(0);
  });

  it('matches screenshot seed axes (Kontoauszug→Finanzen, Lohnsteuer→Steuern, Mietvertrag→Vertrag)', () => {
    const dim = 8;
    function vec(values: number[]): number[] {
      const out = Array.from({ length: dim }, (_, i) => values[i] ?? 0);
      const norm = Math.hypot(...out) || 1;
      return out.map((v) => v / norm);
    }
    const finanzen = vec([1, 0, 0, 0, 0, 0, 0, 0]);
    const steuern = vec([0, 1, 0, 0, 0, 0, 0, 0]);
    const vertrag = vec([0, 0, 1, 0, 0, 0, 0, 0]);
    const centroidsSeed = [
      { tagId: 'finanzen', centroid: finanzen },
      { tagId: 'steuern', centroid: steuern },
      { tagId: 'vertrag', centroid: vertrag },
    ];
    const tagNameById = new Map([
      ['finanzen', 'Finanzen'],
      ['steuern', 'Steuern'],
      ['vertrag', 'Vertrag'],
    ]);
    const labelSupport = new Map([
      ['finanzen', 1],
      ['steuern', 1],
      ['vertrag', 2],
    ]);
    const rows = [
      {
        documentId: 'kontoauszug',
        embedding: vec([0.96, 0.04, 0, 0, 0, 0, 0, 0]),
        nonInboxTagIds: [] as string[],
      },
      {
        documentId: 'lohnsteuer',
        embedding: vec([0.04, 0.96, 0, 0, 0, 0, 0, 0]),
        nonInboxTagIds: [] as string[],
      },
      {
        documentId: 'mietvertrag-garage',
        embedding: vec([0, 0.04, 0.96, 0, 0, 0, 0, 0]),
        nonInboxTagIds: [] as string[],
      },
    ];
    const recs = suggestAssignRecommendations({
      rows,
      centroids: centroidsSeed,
      tagNameById,
      labelSupportCountByTagId: labelSupport,
      threshold: 0.62,
      dismissedKeys: new Set(),
    });
    const byDoc = new Map(recs.map((r) => [r.documentId, r.tagName]));
    expect(byDoc.get('kontoauszug')).toBe('Finanzen');
    expect(byDoc.get('lohnsteuer')).toBe('Steuern');
    expect(byDoc.get('mietvertrag-garage')).toBe('Vertrag');
  });
});

describe('merge scoring', () => {
  it('combines centroid and cross-document similarity', () => {
    const scored = scoreLabelPairForMerge(
      {
        tagId: 'a',
        name: 'A',
        centroid: [1, 0, 0],
        docEmbeddings: [
          [0.98, 0.02, 0],
          [0.97, 0.03, 0],
        ],
      },
      {
        tagId: 'b',
        name: 'B',
        centroid: [0.92, 0.08, 0],
        docEmbeddings: [
          [0.9, 0.1, 0],
          [0.88, 0.12, 0],
        ],
      }
    );
    expect(scored).not.toBeNull();
    expect(scored!.similarity).toBeGreaterThan(0.78);
  });

  it('does not merge Rechnung and SEPA with one document each', () => {
    const merges = suggestEmbeddingMergeRecommendations({
      tags: [
        { tagId: 'a', name: 'Rechnung', centroid: [0, 1, 0] },
        { tagId: 'b', name: 'SEPA Lastschriftmandat', centroid: [0, 0.93, 0.07] },
      ],
      docEmbeddingsByTagId: new Map([
        ['a', [[0, 1, 0]]],
        ['b', [[0, 0.93, 0.07]]],
      ]),
      dismissedKeys: new Set(),
      nameNearDuplicate: () => false,
    });
    expect(merges).toHaveLength(0);
  });

  it('does not merge Auftrag and Vertrag without near-duplicate names', () => {
    const merges = suggestEmbeddingMergeRecommendations({
      tags: [
        { tagId: 'a', name: 'Vertrag', centroid: [1, 0, 0] },
        { tagId: 'b', name: 'Auftragsbestätigung', centroid: [0.9, 0.1, 0] },
      ],
      docEmbeddingsByTagId: new Map([
        [
          'a',
          [
            [0.99, 0.01, 0],
            [0.98, 0.02, 0],
            [0.97, 0.03, 0],
          ],
        ],
        [
          'b',
          [
            [0.91, 0.09, 0],
            [0.89, 0.11, 0],
            [0.88, 0.12, 0],
          ],
        ],
      ]),
      dismissedKeys: new Set(),
      nameNearDuplicate: () => false,
    });
    expect(merges).toHaveLength(0);
  });

  it('surfaces merge when names are near duplicates and support is sufficient', () => {
    const merges = suggestEmbeddingMergeRecommendations({
      tags: [
        { tagId: 'a', name: 'Rechnung', centroid: [0, 1, 0] },
        { tagId: 'b', name: 'Rechnungen', centroid: [0, 0.98, 0.02] },
      ],
      docEmbeddingsByTagId: new Map([
        [
          'a',
          [
            [0, 1, 0],
            [0, 0.99, 0.01],
            [0, 0.98, 0.02],
          ],
        ],
        [
          'b',
          [
            [0, 0.97, 0.03],
            [0, 0.96, 0.04],
            [0, 0.95, 0.05],
          ],
        ],
      ]),
      dismissedKeys: new Set(),
      nameNearDuplicate: (x, y) => x.startsWith('Rechnung') && y.startsWith('Rechnung'),
    });
    expect(merges.length).toBeGreaterThanOrEqual(1);
    expect(merges[0]?.similarity).toBeGreaterThan(0.75);
  });
});
