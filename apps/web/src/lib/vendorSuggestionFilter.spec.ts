// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { isPlausibleVendorSuggestion } from './vendorSuggestionFilter';

describe('isPlausibleVendorSuggestion', () => {
  it('rejects Thomas paper title as sender', () => {
    expect(isPlausibleVendorSuggestion('Closed-Form Document Layout Classification')).toBe(
      false
    );
  });

  it('accepts company names', () => {
    expect(isPlausibleVendorSuggestion('Example Research GmbH')).toBe(true);
  });
});
