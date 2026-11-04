// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  matchesBlocklistPattern,
  matchesUserBlocklist,
} from './recommendation-blocklist.js';

describe('recommendation-blocklist', () => {
  it('blocks candidates matching user phrase', () => {
    expect(matchesUserBlocklist('PDF-XChange Producer', ['PDF-XChange'])).toBe(true);
    expect(matchesUserBlocklist('Angebot', ['PDF-XChange'])).toBe(false);
  });

  it('matches confirmed regex patterns', () => {
    expect(matchesBlocklistPattern('PDF-XCHANGE Editor', ['pdf[- ]?xchange'])).toBe(true);
    expect(matchesBlocklistPattern('Angebot', ['pdf[- ]?xchange'])).toBe(false);
  });
});
