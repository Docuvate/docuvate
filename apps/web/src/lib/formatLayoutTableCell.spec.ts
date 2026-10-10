// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatLayoutTableCell } from './formatLayoutTableCell';

describe('formatLayoutTableCell', () => {
  it('only normalizes whitespace and leaves content unchanged', () => {
    expect(formatLayoutTableCell('Seite 1 von 3')).toBe('Seite 1 von 3');
    expect(formatLayoutTableCell('Zimmer 12')).toBe('Zimmer 12');
    expect(formatLayoutTableCell('Größe 42')).toBe('Größe 42');
    expect(formatLayoutTableCell('Kosten in EUR')).toBe('Kosten in EUR');
    expect(formatLayoutTableCell('Haus am See')).toBe('Haus am See');
    expect(formatLayoutTableCell('1.234,56 EUR')).toBe('1.234,56 EUR');
    expect(formatLayoutTableCell('p(x|c), π ,p(c|x) c')).toBe('p(x|c), π ,p(c|x) c');
    expect(formatLayoutTableCell('μ ,Σ c w')).toBe('μ ,Σ c w');
    expect(formatLayoutTableCell('x; y or c; K; d')).toBe('x; y or c; K; d');
  });
});
