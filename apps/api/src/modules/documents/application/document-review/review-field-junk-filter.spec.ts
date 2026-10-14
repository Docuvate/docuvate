// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isJunkReviewFieldSuggestion } from './review-field-junk-filter.js';

describe('isJunkReviewFieldSuggestion', () => {
  it('drops zero amounts and vendor equal to title', () => {
    expect(
      isJunkReviewFieldSuggestion({
        key: 'suggestion:amount',
        value: '0,00',
        title: 'Rechnung',
        filename: 'rechnung.pdf',
      })
    ).toBe(true);
    expect(
      isJunkReviewFieldSuggestion({
        key: 'suggestion:vendor',
        value: 'Rechnung',
        title: 'Rechnung',
        filename: 'rechnung.pdf',
      })
    ).toBe(true);
  });
});
