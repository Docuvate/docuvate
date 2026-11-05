// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { buildReviewFieldSuggestions } from './document-review-field-display.js';

const CONTEXT = { title: 'Rechnung 4711', filename: 'rechnung-4711.pdf' };

function suggestionKeys(fields: ExtractedField[]): string[] {
  return buildReviewFieldSuggestions(fields, new Set(), new Map(), CONTEXT).map((s) => s.key);
}

describe('buildReviewFieldSuggestions', () => {
  it('offers model suggestions and unconfirmed heuristic values', () => {
    expect(
      suggestionKeys([
        { key: 'suggestion:vendor', value: 'Muster Handels GmbH', confidence: 0.9 },
        { key: 'amount', value: '119,00 EUR', confidence: 0.95 },
      ])
    ).toEqual(['vendor', 'amount']);
  });

  it('no longer offers a value a person confirmed or corrected', () => {
    expect(
      suggestionKeys([{ key: 'vendor', value: 'Beispiel AG', confidence: 0.95, userConfirmed: true }])
    ).toEqual([]);
  });

  it('drops a stale suggestion for a field that already has a confirmed value', () => {
    expect(
      suggestionKeys([
        { key: 'suggestion:vendor', value: 'Muster Handels GmbH', confidence: 0.9 },
        { key: 'vendor', value: 'Beispiel AG', confidence: 1, userConfirmed: true },
        { key: 'suggestion:amount', value: '119,00 EUR', confidence: 0.9 },
      ])
    ).toEqual(['amount']);
  });
});
