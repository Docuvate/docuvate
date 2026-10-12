// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { composeCitedClaimText } from './compose-cited-claim-text.js';

describe('composeCitedClaimText', () => {
  it('turns a short quote into a polished sentence', () => {
    expect(composeCitedClaimText('bis zum 3. Werktag', 'bis zum 3. Werktag')).toBe(
      'bis zum 3. Werktag.'
    );
  });

  it('replaces chunk dumps with the quote sentence', () => {
    const chunk =
      'Rechnung Nordwind GmbH. Gesamtsumme: 1.234,56 EUR. IBAN DE89… Randnotiz OCR Randnotiz OCR Randnotiz OCR Randnotiz OCR Randnotiz OCR Randnotiz OCR Randnotiz OCR Randnotiz OCR';
    const quote = 'Gesamtsumme: 1.234,56 EUR';
    const out = composeCitedClaimText(chunk, quote);
    expect(out).toBe('Gesamtsumme: 1.234,56 EUR.');
    expect(out).not.toContain('Randnotiz');
  });

  it('keeps an already composed short claim', () => {
    expect(
      composeCitedClaimText(
        'Die Miete ist bis zum 3. Werktag fällig.',
        'bis zum 3. Werktag'
      )
    ).toBe('Die Miete ist bis zum 3. Werktag fällig.');
  });
});
