// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { buildLayoutReadingBlocks } from './layoutIrReadingContent';

describe('buildLayoutReadingBlocks', () => {
  it('orders lines in reading order and emits headings before paragraphs', () => {
    const doc: LayoutIrDocument = {
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [],
          lines: [
            {
              page: 1,
              x: 0.1,
              y: 0.1,
              width: 0.8,
              height: 0.02,
              text: 'Rechnung',
              fontSizePt: 14,
              weight: 'bold',
            },
            {
              page: 1,
              x: 0.1,
              y: 0.2,
              width: 0.8,
              height: 0.02,
              text: 'Erste Zeile des Absatzes.',
            },
            {
              page: 1,
              x: 0.1,
              y: 0.24,
              width: 0.8,
              height: 0.02,
              text: 'Zweite Zeile des Absatzes.',
            },
          ],
        },
      ],
    };

    const blocks = buildLayoutReadingBlocks(doc);
    expect(blocks[0]?.kind).toBe('heading');
    expect(blocks[1]?.kind).toBe('paragraph');
    expect(blocks[1]?.text).toContain('Erste Zeile');
    expect(blocks[1]?.text).toContain('Zweite Zeile');
  });
});
