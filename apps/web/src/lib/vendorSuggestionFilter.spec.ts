// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { isHeadingLikeVendorValue, isPlausibleVendorSuggestion } from './vendorSuggestionFilter';

const SYNTHETIC_PAPER_TITLE =
  'Synthetic Nine Word Academic Title Case Example Heading';

describe('isPlausibleVendorSuggestion', () => {
  it('rejects long title-case headings without company suffix', () => {
    expect(isPlausibleVendorSuggestion(SYNTHETIC_PAPER_TITLE)).toBe(false);
    expect(isHeadingLikeVendorValue(SYNTHETIC_PAPER_TITLE)).toBe(true);
  });

  it('accepts company names', () => {
    expect(isPlausibleVendorSuggestion('Example Research GmbH')).toBe(true);
  });
});
