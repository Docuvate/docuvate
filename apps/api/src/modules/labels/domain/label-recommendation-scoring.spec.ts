// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  formatAssignRecommendationReason,
  similarityDisplayTier,
  suggestAssignRecommendations,
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
      labelSupportCount: 3,
    });
    expect(reason).toMatch(/99 %/);
  });

  it('classifies similarity tiers', () => {
    expect(similarityDisplayTier(0.85)).toBe('high');
    expect(similarityDisplayTier(0.7)).toBe('medium');
    expect(similarityDisplayTier(0.5)).toBe('low');
  });
});

describe('suggestAssignRecommendations', () => {
  const centroids = [{ tagId: 'vertrag', centroid: [1, 0, 0] }];

  it('recommends assign when unlabeled doc is near a centroid', () => {
    const rows = [
      {
        documentId: 'd1',
        embedding: [0.95, 0.05, 0],
        nonInboxTagIds: [] satisfies string[],
        text: 'vertrag mietvertrag',
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
        nonInboxTagIds: [] satisfies string[],
        text: 'vertrag mietvertrag',
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
        nonInboxTagIds: [] satisfies string[],
        text: 'kontoauszug finanzen',
      },
      {
        documentId: 'lohnsteuer',
        embedding: vec([0.04, 0.96, 0, 0, 0, 0, 0, 0]),
        nonInboxTagIds: [] satisfies string[],
        text: 'lohnsteuer steuer',
      },
      {
        documentId: 'mietvertrag-garage',
        embedding: vec([0, 0.04, 0.96, 0, 0, 0, 0, 0]),
        nonInboxTagIds: [] satisfies string[],
        text: 'mietvertrag vertrag garage',
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
