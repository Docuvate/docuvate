// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { rewriteLayoutIrText } from './layout-ir-text.js';

const north = {
  page: 1,
  x: 0.12,
  y: 0.12,
  width: 0.2,
  height: 0.02,
  text: 'NORTH 1842',
  blockIndex: 0,
};
const invoice = {
  page: 1,
  x: 0.12,
  y: 0.17,
  width: 0.28,
  height: 0.02,
  text: 'INVOICE TOTAL',
  blockIndex: 1,
};
const previous = [north, invoice];

const ir = {
  version: 1,
  pages: [
    {
      page: 1,
      widthPt: 595,
      heightPt: 842,
      blocks: [
        { page: 1, x: 72, y: 100, width: 120, height: 18, text: 'NORTH 1842', blockIndex: 0 },
        { page: 1, x: 72, y: 140, width: 160, height: 18, text: 'INVOICE TOTAL', blockIndex: 1 },
      ],
      lines: [
        { page: 1, x: 72, y: 100, width: 120, height: 18, text: 'NORTH 1842', blockIndex: 0 },
      ],
      tables: [
        {
          page: 1,
          x: 40,
          y: 200,
          width: 400,
          height: 80,
          columnCount: 2,
          rows: [[{ text: 'NORTH 1842', x: 40, y: 200, width: 80, height: 16, blockIndex: 0 }]],
        },
      ],
      vectors: [{ kind: 'line', x: 40, y: 190, width: 400, height: 1 }],
    },
  ],
};

describe('rewriteLayoutIrText', () => {
  it('keeps the page, the table, and the untouched line, and writes the corrected text', () => {
    const next = [{ ...north, text: 'NORTH 1842 REVISED' }, invoice];
    const rewritten = rewriteLayoutIrText(ir, previous, next);
    expect(rewritten).toMatchObject({
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [
            { text: 'NORTH 1842 REVISED', x: 72, blockIndex: 0 },
            { text: 'INVOICE TOTAL', blockIndex: 1 },
          ],
          lines: [{ text: 'NORTH 1842 REVISED', blockIndex: 0 }],
          tables: [
            {
              x: 40,
              columnCount: 2,
              rows: [[{ text: 'NORTH 1842 REVISED', blockIndex: 0 }]],
            },
          ],
          vectors: [{ kind: 'line', x: 40, width: 400 }],
        },
      ],
    });
  });

  it('clears text for a block the user removed and leaves the node', () => {
    const rewritten = rewriteLayoutIrText(ir, previous, [invoice]);
    expect(rewritten).toMatchObject({
      pages: [
        {
          blocks: [{ text: '', blockIndex: 0 }, { text: 'INVOICE TOTAL', blockIndex: 1 }],
          widthPt: 595,
        },
      ],
    });
  });
});
