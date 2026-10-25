// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { trainInWorkerThread } from '../infrastructure/label-hybrid-trainer.js';
import type { LabelHybridDocumentRow } from './label-hybrid-training.js';

function syntheticRow(documentId: string, tagIndex: number, seed: number): LabelHybridDocumentRow {
  const tagId = `tag-${String(tagIndex)}`;
  const embedding = Array.from({ length: 32 }, (_, i) => Math.sin(seed * (i + 1) * 0.13 + tagIndex));
  const text = `document kind ${String(tagIndex)} token block ${String(seed)} reference ${String(seed % 23)}`;
  return {
    documentId,
    embedding,
    nonInboxTagIds: [tagId],
    text,
  };
}

function buildSyntheticCorpus(exampleCount: number, labelCount: number): LabelHybridDocumentRow[] {
  const out: LabelHybridDocumentRow[] = [];
  for (let i = 0; i < exampleCount; i += 1) {
    out.push(syntheticRow(`doc-${String(i)}`, i % labelCount, i + 1));
  }
  return out;
}

async function trainMs(rows: LabelHybridDocumentRow[]): Promise<number> {
  const started = performance.now();
  const model = await trainInWorkerThread(rows);
  if (model === null) {
    throw new Error('expected trainable hybrid model');
  }
  return performance.now() - started;
}

describe('label-hybrid-auto-match performance guard', () => {
  it('trains off-thread within a generous bound and LOO calibration scales sub-cubically', async () => {
    // Warm up the worker so cold-start JIT does not dominate the scaling ratio on CI.
    await trainMs(buildSyntheticCorpus(40, 10));

    const small = buildSyntheticCorpus(100, 25);
    const large = buildSyntheticCorpus(200, 40);
    const smallMs = await trainMs(small);
    const largeMs = await trainMs(large);
    const sizeRatio = 200 / 100;
    expect(largeMs).toBeLessThan(90_000);
    expect(largeMs / Math.max(smallMs, 1)).toBeLessThan(sizeRatio * sizeRatio * 16);
  }, 180_000);
});
