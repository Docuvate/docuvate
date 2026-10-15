// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  discoverOpenSetNewLabelClusters,
  evaluateOpenSetDiscoveryPrecision,
  OPEN_SET_EVAL_TARGET_PRECISION,
  type OpenSetDocumentRow,
} from './label-open-set-discovery.js';

const THRESHOLD = 0.62;
const DIM = 8;

function vec(values: number[]): number[] {
  const out = Array.from({ length: DIM }, (_, i) => values[i] ?? 0);
  const norm = Math.hypot(...out) || 1;
  return out.map((v) => v / norm);
}

function row(input: {
  id: string;
  embedding: number[];
  title: string;
  text: string;
  fields?: { key: string; value: string }[];
}): OpenSetDocumentRow {
  return {
    documentId: input.id,
    embedding: input.embedding,
    nonInboxTagIds: [],
    title: input.title,
    filename: `${input.id}.pdf`,
    text: input.text,
    fields: input.fields ?? [],
  };
}

describe('label-open-set-discovery', () => {
  it('names clusters from discriminative c-TF-IDF terms, not a fixed vocabulary', () => {
    const labeledCentroid = vec([1, 0, 0, 0, 0, 0, 0, 0]);
    const payrollA = vec([0, 0.98, 0.02, 0, 0, 0, 0, 0]);
    const payrollB = vec([0, 0.96, 0.04, 0, 0, 0, 0, 0]);
    const noise = vec([0, 0.1, 0.05, 0.9, 0, 0, 0, 0]);

    const suggestions = discoverOpenSetNewLabelClusters({
      rows: [
        row({
          id: 'p1',
          embedding: payrollA,
          title: 'Entgelt Oktober',
          text: 'gehaltsabrechnung entgelt brutto netto oktober',
        }),
        row({
          id: 'p2',
          embedding: payrollB,
          title: 'Entgelt November',
          text: 'gehaltsabrechnung entgelt brutto netto november',
        }),
        row({
          id: 'n1',
          embedding: noise,
          title: 'Notiz',
          text: 'allgemeine notiz ohne struktur',
        }),
      ],
      centroids: [{ tagId: 'finanzen', centroid: labeledCentroid }],
      threshold: THRESHOLD,
      dismissedKeys: new Set(),
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.documentIds).toEqual(expect.arrayContaining(['p1', 'p2']));
    expect(['gehaltsabrechnung', 'entgelt']).toContain(
      suggestions[0]?.proposedName.toLowerCase() ?? ''
    );
    expect(suggestions[0]?.reason).toMatch(/ähnliche Dokumente ohne Label/);
  });

  it('does not emit multiple new-label suggestions for one document', () => {
    const labeledCentroid = vec([1, 0, 0, 0, 0, 0, 0, 0]);
    const payrollA = vec([0, 0.98, 0.02, 0, 0, 0, 0, 0]);
    const payrollB = vec([0, 0.96, 0.04, 0, 0, 0, 0, 0]);

    const suggestions = discoverOpenSetNewLabelClusters({
      rows: [
        row({
          id: 'p1',
          embedding: payrollA,
          title: 'Entgelt',
          text: 'gehaltsabrechnung entgelt',
        }),
        row({
          id: 'p2',
          embedding: payrollB,
          title: 'Entgelt',
          text: 'gehaltsabrechnung entgelt',
        }),
      ],
      centroids: [{ tagId: 'finanzen', centroid: labeledCentroid }],
      threshold: THRESHOLD,
      dismissedKeys: new Set(),
    });

    const docCounts = new Map<string, number>();
    for (const suggestion of suggestions) {
      for (const docId of suggestion.documentIds) {
        docCounts.set(docId, (docCounts.get(docId) ?? 0) + 1);
      }
    }
    for (const count of docCounts.values()) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it('meets calibrated precision on synthetic held-out fixtures', () => {
    const finanzen = vec([1, 0, 0, 0, 0, 0, 0, 0]);
    const payrollCluster = 'payroll';
    const insuranceCluster = 'insurance';

    const payrollRows = [
      row({
        id: 'pay1',
        embedding: vec([0, 0.97, 0.03, 0, 0, 0, 0, 0]),
        title: 'Gehalt',
        text: 'gehaltsabrechnung oktober brutto netto',
      }),
      row({
        id: 'pay2',
        embedding: vec([0, 0.96, 0.04, 0, 0, 0, 0, 0]),
        title: 'Gehalt',
        text: 'gehaltsabrechnung november brutto netto',
      }),
    ];
    const insuranceRows = [
      row({
        id: 'ins1',
        embedding: vec([0, 0.03, 0.97, 0, 0, 0, 0, 0]),
        title: 'Police',
        text: 'haftpflichtversicherung police deckung',
      }),
      row({
        id: 'ins2',
        embedding: vec([0, 0.04, 0.96, 0, 0, 0, 0, 0]),
        title: 'Police',
        text: 'haftpflichtversicherung police schadenfreiheit',
      }),
    ];
    const noiseRows = [
      row({
        id: 'noise1',
        embedding: vec([0, 0.2, 0.2, 0.9, 0, 0, 0, 0]),
        title: 'Notiz',
        text: 'sonstiges schreiben ohne wiedererkennbares thema',
      }),
    ];

    const expected = new Map<string, string>([
      ['pay1', payrollCluster],
      ['pay2', payrollCluster],
      ['ins1', insuranceCluster],
      ['ins2', insuranceCluster],
    ]);

    const metrics = evaluateOpenSetDiscoveryPrecision([
      {
        rows: [...payrollRows, ...insuranceRows, ...noiseRows],
        centroids: [{ tagId: 'finanzen', centroid: finanzen }],
        threshold: THRESHOLD,
        expectedClusterByDoc: expected,
        mustNotSuggest: new Set(['noise1']),
      },
    ]);

    expect(metrics.suggested).toBeGreaterThan(0);
    expect(metrics.precision).toBeGreaterThanOrEqual(OPEN_SET_EVAL_TARGET_PRECISION);
  });
});
