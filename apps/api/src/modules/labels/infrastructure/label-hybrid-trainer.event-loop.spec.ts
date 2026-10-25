// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { trainInWorkerThread } from './label-hybrid-trainer.js';

function syntheticRow(documentId: string, tagIndex: number, seed: number): LabelHybridDocumentRow {
  const tagId = `tag-${String(tagIndex)}`;
  const embedding = Array.from({ length: 32 }, (_, i) => Math.sin(seed * (i + 1) * 0.11 + tagIndex));
  const text = `invoice block ${String(tagIndex)} amount ${String(seed)} ref ${String(seed % 19)}`;
  return {
    documentId,
    embedding,
    nonInboxTagIds: [tagId],
    text,
  };
}

function buildCorpus(exampleCount: number, labelCount: number): LabelHybridDocumentRow[] {
  const out: LabelHybridDocumentRow[] = [];
  for (let i = 0; i < exampleCount; i += 1) {
    out.push(syntheticRow(`doc-${String(i)}`, i % labelCount, i + 3));
  }
  return out;
}

describe('label hybrid trainer event loop', () => {
  it('does not block the event loop for more than ~100ms while training runs in a worker', async () => {
    const rows = buildCorpus(100, 20);
    const gaps: number[] = [];
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      gaps.push(now - last);
      last = now;
    }, 10);

    await trainInWorkerThread(rows);

    clearInterval(timer);
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    expect(maxGap).toBeLessThan(150);
  }, 30_000);
});
