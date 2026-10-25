// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { attachPagesToChunks, splitTextChunksWithSpans } from './split-text-chunks-with-spans.js';

function syntheticBlocks(count: number): ExtractionBlock[] {
  const blocks: ExtractionBlock[] = [];
  for (let i = 0; i < count; i += 1) {
    blocks.push({
      page: (i % 40) + 1,
      blockIndex: i,
      x: 0.1,
      y: 0.1,
      width: 0.5,
      height: 0.02,
      text: `Block ${String(i)} invoice total amount reference ${String(i % 17)}`,
    });
  }
  return blocks;
}

function indexChunksMs(text: string, blocks: ExtractionBlock[]): number {
  const started = performance.now();
  const chunks = splitTextChunksWithSpans(text);
  attachPagesToChunks(chunks, blocks);
  return performance.now() - started;
}

describe('splitTextChunksWithSpans performance guard', () => {
  it('scales sub-quadratically on large documents', () => {
    const paragraph = 'Rechnung Betrag Gesamtsumme Position Artikel Menge Einzelpreis Netto Brutto. ';
    const blocks = syntheticBlocks(4_000);
    const smallMs = indexChunksMs(paragraph.repeat(120), blocks.slice(0, 200));
    const largeMs = indexChunksMs(paragraph.repeat(12_000), blocks);
    const textRatio = 12_000 / 120;
    expect(largeMs).toBeLessThan(5_000);
    expect(largeMs / Math.max(smallMs, 0.01)).toBeLessThan(textRatio * 8);
  });
});
