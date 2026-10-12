// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  buildDuplicateFeatureVector,
  compareDocumentTexts,
  decideDuplicatePair,
  DEFAULT_DUPLICATE_CLASSIFIER_MODEL,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

describe('duplicate content compare', () => {
  it('treats same-template different values as high content difference', () => {
    const template = 'Statement account 12345 period ending';
    const a = `${template} 01/01/2024 balance 1000.00`;
    const b = `${template} 01/01/2025 balance 2500.00`;
    const alignment = compareDocumentTexts(a, b);
    expect(alignment.fractionDifferingValueTokens).toBeGreaterThan(0.1);
    const features = buildDuplicateFeatureVector({
      left: {
        documentId: 'a',
        filename: 'a.pdf',
        title: 'a',
        extractedTextSample: a,
        pageCount: 2,
      },
      right: {
        documentId: 'b',
        filename: 'b.pdf',
        title: 'b',
        extractedTextSample: b,
        pageCount: 2,
      },
      embeddingSimilarity: 0.9,
      perceptualPageHashDistance: null,
    });
    const decision = decideDuplicatePair(DEFAULT_DUPLICATE_CLASSIFIER_MODEL, features, 0);
    expect(decision.decision).not.toBe('auto_stack');
  });

  it('treats re-exports with identical values as auto-stack candidates', () => {
    const base = 'Invoice 998877 total 499.50 vendor acme services line 1 line 2';
    const reexport = 'Invoice 998877 total 499.50 vendor acme services line 1 line 2';
    const features = buildDuplicateFeatureVector({
      left: {
        documentId: 'a',
        filename: 'scan.pdf',
        title: 'scan',
        extractedTextSample: base,
        pageCount: 2,
      },
      right: {
        documentId: 'b',
        filename: 'scan-copy.pdf',
        title: 'scan',
        extractedTextSample: reexport,
        pageCount: 2,
      },
      embeddingSimilarity: 0.97,
      perceptualPageHashDistance: 0.02,
    });
    const decision = decideDuplicatePair(DEFAULT_DUPLICATE_CLASSIFIER_MODEL, features, 0);
    expect(decision.decision).toBe('auto_stack');
  });
});
