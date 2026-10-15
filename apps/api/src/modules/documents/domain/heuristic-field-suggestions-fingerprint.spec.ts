// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  fingerprintToHeuristicFieldVersion,
  HEURISTIC_FIELD_EXTRACTOR_VERSION,
  HEURISTIC_FIELD_SUGGESTIONS_LOGIC_SHA256,
  readLiveHeuristicFieldSuggestionsSha256,
} from './heuristic-field-suggestions-fingerprint.js';

describe('heuristic field suggestions fingerprint', () => {
  it('matches worker field_suggestions.py (update SHA when logic changes)', () => {
    expect(readLiveHeuristicFieldSuggestionsSha256()).toBe(
      HEURISTIC_FIELD_SUGGESTIONS_LOGIC_SHA256
    );
  });

  it('derives heuristic extractor version from fingerprint', () => {
    expect(HEURISTIC_FIELD_EXTRACTOR_VERSION).toBe(
      fingerprintToHeuristicFieldVersion(HEURISTIC_FIELD_SUGGESTIONS_LOGIC_SHA256)
    );
  });
});
