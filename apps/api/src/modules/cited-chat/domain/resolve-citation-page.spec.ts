// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolveCitationPageFromBlocks } from './resolve-citation-page.js';

describe('resolveCitationPageFromBlocks', () => {
  it('uses block page when quote is on a later page than chunk metadata', () => {
    const blocks = [
      { page: 1, text: 'Deckblatt', blockIndex: 0, x: 0, y: 0, width: 1, height: 1 },
      {
        page: 7,
        text: 'Jahresüberschuss 26.870,52 EUR',
        blockIndex: 1,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ];
    const page = resolveCitationPageFromBlocks('26.870,52', blocks, 1);
    expect(page).toBe(7);
  });

  it('falls back to chunk page when quote is not in blocks', () => {
    expect(resolveCitationPageFromBlocks('fehlt', [], 4)).toBe(4);
  });
});
