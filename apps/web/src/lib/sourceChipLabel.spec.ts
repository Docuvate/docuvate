// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { sourceChipFullLabel, sourceChipPageLabel } from './sourceChipLabel';

describe('sourceChipLabel', () => {
  it('uses a short page form instead of the document title', () => {
    expect(sourceChipPageLabel(1, 'de')).toBe('Seite 1');
    expect(sourceChipPageLabel(2, 'en')).toBe('Page 2');
    expect(sourceChipFullLabel(1, 'de', 'Nachzahlung')).toBe('Seite 1 · Nachzahlung');
  });
});
