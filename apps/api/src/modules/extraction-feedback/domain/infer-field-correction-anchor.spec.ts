// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { inferFieldCorrectionAnchorLabel } from './infer-field-correction-anchor.js';

describe('inferFieldCorrectionAnchorLabel', () => {
  it('uses tokens left of the corrected amount on the payslip line', () => {
    const text = [
      'ENTGELTNACHWEIS 13.01.2024 Muster AG',
      'Bruttoentgelt / Gesamtbrutto (EBeschV) 6.400,00',
    ].join('\n');
    expect(inferFieldCorrectionAnchorLabel(text, '6.400,00')).toBe(
      'Bruttoentgelt / Gesamtbrutto (EBeschV)'
    );
  });

  it('strips period prefix before anchor tokens', () => {
    const text = '/10E Gesamtbrutto (EBeschV) 5.432,10 54.321,00';
    expect(inferFieldCorrectionAnchorLabel(text, '5.432,10')).toBe('Gesamtbrutto (EBeschV)');
  });
});
