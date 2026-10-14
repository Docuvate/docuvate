// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { verifyCitedClaims } from './verify-cited-claims.js';

describe('verifyCitedClaims empty quote repair', () => {
  it('grounds an empty model quote from claim text in the cited chunk', () => {
    const chunk = {
      chunkId: 'c1',
      documentId: 'd1',
      documentTitle: 'Lohn',
      body: 'Gesamtbrutto 4.321,00 EUR',
      page: 1,
      charStart: 0,
      charEnd: 26,
      fusionScore: 0.9,
    };
    const labelByChunk = new Map<string, string>([[chunk.chunkId, 'S1']]);
    const { verified, rejected } = verifyCitedClaims({
      claims: [
        {
          text: 'Das Gesamtbrutto beträgt 4.321,00 EUR.',
          source: 'S1',
          quote: '',
        },
      ],
      top: [{ chunk }],
      labelByChunk,
    });
    expect(rejected).toHaveLength(0);
    expect(verified).toHaveLength(1);
    expect(verified[0]?.quote).toContain('4.321');
  });
});
