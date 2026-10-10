// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { formatLayoutTableCell } from './formatLayoutTableCell';

describe('formatLayoutTableCell', () => {
  it('merges spaced subscript fragments from the layout paper symbol column', () => {
    expect(formatLayoutTableCell('p(x|c),π ,p(c|x) c')).toBe('p(x|c), π, p(c|x)c');
    expect(formatLayoutTableCell('μ ,Σ c w')).toBe('μ, Σc w');
    expect(formatLayoutTableCell('Σ ,m b')).toBe('Σ, mb');
    expect(formatLayoutTableCell('l (x),β,b c c')).toBe('l (x), β, bc c');
    expect(formatLayoutTableCell('n,x,G n')).toBe('n, x, Gn');
    expect(formatLayoutTableCell('S,T,Π S')).toBe('S, T, ΠS');
  });

  it('leaves normal German prose and numbers unchanged', () => {
    expect(formatLayoutTableCell('Seite 1 von 3')).toBe('Seite 1 von 3');
    expect(formatLayoutTableCell('Zimmer 12')).toBe('Zimmer 12');
    expect(formatLayoutTableCell('Größe 42')).toBe('Größe 42');
    expect(formatLayoutTableCell('Kosten in EUR')).toBe('Kosten in EUR');
    expect(formatLayoutTableCell('Haus am See')).toBe('Haus am See');
    expect(formatLayoutTableCell('1.234,56 EUR')).toBe('1.234,56 EUR');
  });
});
