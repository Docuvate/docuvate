// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  hashNormalizedExtractedText,
  normalizeExtractedTextForHash,
} from './normalized-extracted-text-hash.js';

describe('normalized extracted text hash', () => {
  it('collapses whitespace and case', () => {
    expect(normalizeExtractedTextForHash('  Hello\n  WORLD \t')).toBe('hello world');
    const a = hashNormalizedExtractedText('Foo  bar');
    const b = hashNormalizedExtractedText('foo bar');
    expect(a).toBe(b);
  });
});
