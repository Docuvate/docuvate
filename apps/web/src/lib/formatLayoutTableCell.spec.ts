// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { formatLayoutTableCell } from './formatLayoutTableCell';

describe('formatLayoutTableCell', () => {
  it('merges spaced subscript fragments', () => {
    expect(formatLayoutTableCell('p(x|c),π ,p(c|x) c')).toBe('p(x|c), π, p(c|x)c');
  });

  it('merges greek symbol runs', () => {
    expect(formatLayoutTableCell('μ ,Σ c w')).toBe('μ, Σc w');
  });
});
