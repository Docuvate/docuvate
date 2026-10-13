// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { EXACT_FACT_MATCH_DEFAULT_THRESHOLD } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import type { ExactFactRow } from './exact-fact-row.js';
import { bestExactFactMatchScore, passesExactFactMatchGate } from './exact-fact-match-gate.js';

function row(predicateKey: string): ExactFactRow {
  return {
    factId: 'f1',
    documentId: 'd1',
    documentTitle: 'Doc',
    kind: 'amount',
    predicateKey,
    confidence: 0.9,
    valueText: null,
    amountNumeric: 1,
    currencyCode: 'EUR',
    valueDateIso: null,
    page: 1,
    bboxX: null,
    bboxY: null,
    bboxWidth: null,
    bboxHeight: null,
    charStart: 0,
    charEnd: 1,
  };
}

describe('exact fact match gate', () => {
  it('uses recalibrated default 0.55 (below prior strict 0.72 C5 gate)', () => {
    expect(EXACT_FACT_MATCH_DEFAULT_THRESHOLD).toBe(0.55);
  });

  it('rejects decoy partial predicate overlap', () => {
    const score = bestExactFactMatchScore(
      { kind: 'lookup', predicateTokens: ['gewinn', '2025'], yearHint: 2025 },
      [row('reingewinn 2025')]
    );
    expect(
      passesExactFactMatchGate({
        query: { kind: 'lookup', predicateTokens: ['gewinn', '2025'], yearHint: 2025 },
        rows: [row('reingewinn 2025')],
        threshold: EXACT_FACT_MATCH_DEFAULT_THRESHOLD,
      })
    ).toBe(false);
    expect(score).toBeLessThan(EXACT_FACT_MATCH_DEFAULT_THRESHOLD);
  });

  it('accepts answerable lookup tokens', () => {
    expect(
      passesExactFactMatchGate({
        query: { kind: 'lookup', predicateTokens: ['reingewinn', '2025'], yearHint: 2025 },
        rows: [row('reingewinn 2025')],
        threshold: EXACT_FACT_MATCH_DEFAULT_THRESHOLD,
      })
    ).toBe(true);
  });
});
