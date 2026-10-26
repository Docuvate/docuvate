// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  isFourDigitYearToken,
  requiresVocabularyForChunkFts,
} from './chunk-fts-term-policy.js';

describe('chunk-fts-term-policy', () => {
  it('treats four-digit years as not requiring vocabulary', () => {
    expect(isFourDigitYearToken('2025')).toBe(true);
    expect(requiresVocabularyForChunkFts('2025')).toBe(false);
  });

  it('requires vocabulary for long glued compounds', () => {
    expect(requiresVocabularyForChunkFts('rechnungversicherung')).toBe(true);
    expect(requiresVocabularyForChunkFts('kfz')).toBe(false);
    expect(requiresVocabularyForChunkFts('gez')).toBe(false);
  });
});
