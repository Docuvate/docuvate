// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { attachPagesToChunks, splitTextChunksWithSpans } from './split-text-chunks-with-spans.js';

describe('attachPagesToChunks', () => {
  it('assigns page from overlapping block text, not always page 1', () => {
    const docText =
      'Einleitung auf Seite eins. ' +
      'A'.repeat(400) +
      ' Jahresüberschuss 26.870,52 auf späterer Seite. ' +
      'B'.repeat(400);
    const chunks = splitTextChunksWithSpans(docText);
    const blocks = [
      { page: 1, text: 'Einleitung auf Seite eins.', blockIndex: 0, x: 0, y: 0, width: 1, height: 1 },
      {
        page: 7,
        text: 'Jahresüberschuss 26.870,52 auf späterer Seite.',
        blockIndex: 1,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ];
    const withPages = attachPagesToChunks(chunks, blocks);
    const profitChunk = withPages.find((c) => c.body.includes('Jahresüberschuss'));
    expect(profitChunk?.page).toBe(7);
  });
});
