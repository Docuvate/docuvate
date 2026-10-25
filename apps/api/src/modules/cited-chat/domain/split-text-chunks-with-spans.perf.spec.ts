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

describe('splitTextChunksWithSpans performance guard', () => {
  it('indexes large documents in under one second', () => {
    const paragraph = 'Rechnung Betrag Gesamtsumme Position Artikel Menge Einzelpreis Netto Brutto. ';
    const text = paragraph.repeat(12_000);
    const blocks = syntheticBlocks(4_000);
    const started = performance.now();
    const chunks = splitTextChunksWithSpans(text);
    const withPages = attachPagesToChunks(chunks, blocks);
    const elapsedMs = performance.now() - started;
    expect(withPages.length).toBeGreaterThan(100);
    expect(elapsedMs).toBeLessThan(1_000);
  });
});
