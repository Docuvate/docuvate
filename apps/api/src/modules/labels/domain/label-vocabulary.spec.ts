import { describe, expect, it } from 'vitest';
import {
  collectNewLabelCandidates,
  extractBelegTermsFromText,
  inferClusterLabelNameFromSnippets,
  inferCanonicalLabelsFromSnippet,
  isAcceptableLabelCandidate,
  namesAreNearDuplicate,
  normalizeLabelKey,
  suggestMergeAndRename,
} from './label-vocabulary.js';

describe('label-vocabulary', () => {
  it('normalizes German umlauts', () => {
    expect(normalizeLabelKey('Rechnung')).toBe('rechnung');
    expect(normalizeLabelKey('Größe')).toBe('groesse');
  });

  it('detects near duplicate names', () => {
    expect(namesAreNearDuplicate('Rechnung', 'Rechnungen')).toBe(true);
    expect(namesAreNearDuplicate('Haus', 'Photovoltaik')).toBe(false);
  });

  it('extracts Beleg terms from text', () => {
    expect(extractBelegTermsFromText('Ihre Rechnung Nr. 12 vom 01.01.2024')).toContain('Rechnung');
  });

  it('names embedding clusters from shared Beleg terms', () => {
    expect(
      inferClusterLabelNameFromSnippets([
        'Kontoauszug Januar 2024',
        'Kontoauszug Februar 2024',
      ])
    ).toBe('Kontoauszug');
    expect(inferClusterLabelNameFromSnippets(['Allgemeine Notiz', 'Sonstiges Schreiben'])).toBeNull();
  });

  it('rejects PDF producer metadata as label names', () => {
    expect(isAcceptableLabelCandidate('PDF-XCHANGE PDF-XCHANGE')).toBe(false);
    expect(isAcceptableLabelCandidate('Adobe Acrobat')).toBe(false);
  });

  it('maps SEPA mandate phrasing to SEPA-Mandat', () => {
    const hits = inferCanonicalLabelsFromSnippet(
      'Erteilung eines SEPA-Lastschriftmandats für Herrn Beispiel',
      'test'
    );
    expect(hits.some((h) => h.name === 'SEPA-Mandat')).toBe(true);
  });

  it('proposes new labels for unlabeled docs with matching text', () => {
    const candidates = collectNewLabelCandidates(
      [
        {
          documentId: 'd1',
          title: 'Scan',
          filename: 'scan.pdf',
          text: 'Rechnung an Beispiel',
          fields: [],
          nonInboxTagIds: [],
        },
      ],
      [],
      new Set()
    );
    expect(candidates.some((c) => c.name === 'Rechnung')).toBe(true);
  });

  it('does not propose vendor PDF metadata', () => {
    const candidates = collectNewLabelCandidates(
      [
        {
          documentId: 'd1',
          title: 'Scan',
          filename: 'scan.pdf',
          text: '',
          fields: [{ key: 'vendor', value: 'PDF-XCHANGE PDF-XCHANGE' }],
          nonInboxTagIds: [],
        },
      ],
      [],
      new Set()
    );
    expect(candidates).toHaveLength(0);
  });

  it('never emits rename rows with identical display names', () => {
    const suggestions = suggestMergeAndRename(
      [
        { tagId: 't1', name: 'Vertrag', centroid: [1, 0] },
        { tagId: 't2', name: 'Verträge', centroid: [0.99, 0.01] },
        { tagId: 't3', name: 'vertrag', centroid: [] },
      ],
      new Set()
    );
    for (const item of suggestions) {
      if (item.kind === 'rename') {
        expect(item.fromName).not.toBe(item.toName);
      }
    }
  });

  it('proposes casing normalization for vocabulary labels', () => {
    const suggestions = suggestMergeAndRename(
      [{ tagId: 't1', name: 'vertrag', centroid: [] }],
      new Set()
    );
    const rename = suggestions.find((s) => s.kind === 'rename');
    expect(rename?.kind).toBe('rename');
    if (rename?.kind === 'rename') {
      expect(rename.fromName).toBe('vertrag');
      expect(rename.toName).toBe('Vertrag');
    }
  });

  it('skips labels that duplicate an existing tag', () => {
    const candidates = collectNewLabelCandidates(
      [
        {
          documentId: 'd1',
          title: 'Scan',
          filename: 'scan.pdf',
          text: 'Ihr Angebot vom 1.1.',
          fields: [],
          nonInboxTagIds: [],
        },
      ],
      ['Angebot', 'Posteingang'],
      new Set()
    );
    expect(candidates).toHaveLength(0);
  });
});
