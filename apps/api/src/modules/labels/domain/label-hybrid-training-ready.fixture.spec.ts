// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LabelHybridModelCacheService } from '../infrastructure/label-hybrid-model-cache.service.js';
import { InlineLabelHybridTrainer } from '../infrastructure/label-hybrid-trainer.js';
import type { LabelHybridDocumentRow } from './label-hybrid-training.js';
import { trainUserLabelHybridModel } from './label-hybrid-training.js';

function buildRealisticLabelHybridRows(): LabelHybridDocumentRow[] {
  const tagCount = 100;
  const docsPerTag = 24;
  const rows: LabelHybridDocumentRow[] = [];
  const chunkLine = 'invoice line item description with vendor reference ';
  for (let tagIndex = 0; tagIndex < tagCount; tagIndex += 1) {
    const tagId = `tag-${String(tagIndex).padStart(3, '0')}`;
    for (let docIndex = 0; docIndex < docsPerTag; docIndex += 1) {
      const documentId = `doc-${String(tagIndex)}-${String(docIndex)}`;
      const embedding = Array.from({ length: 32 }, (_, dim) =>
        Math.sin(tagIndex * 0.17 + docIndex * 0.03 + dim * 0.11)
      );
      rows.push({
        documentId,
        embedding,
        nonInboxTagIds: [tagId],
        text: `${documentId}\n${chunkLine.repeat(120)}`,
      });
    }
  }
  return rows;
}

describe('label hybrid realistic training fixture', () => {
  beforeEach(() => {
    vi.useRealTimers();
    process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'] = '0';
    process.env['DOCUVATE_LABEL_HYBRID_MAX_TRAINING_EXAMPLES'] = '2400';
    process.env['DOCUVATE_LABEL_HYBRID_MAX_EXAMPLES_PER_TAG'] = '40';
    process.env['DOCUVATE_LABEL_HYBRID_MAX_VOCAB_DOCUMENTS'] = '400';
    process.env['DOCUVATE_LABEL_HYBRID_TEXT_CHARS'] = '2048';
  });

  afterEach(() => {
    delete process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'];
    delete process.env['DOCUVATE_LABEL_HYBRID_MAX_TRAINING_EXAMPLES'];
    delete process.env['DOCUVATE_LABEL_HYBRID_MAX_EXAMPLES_PER_TAG'];
    delete process.env['DOCUVATE_LABEL_HYBRID_MAX_VOCAB_DOCUMENTS'];
    delete process.env['DOCUVATE_LABEL_HYBRID_TEXT_CHARS'];
  });

  it('trains a capped realistic corpus within 60s', () => {
    const rows = buildRealisticLabelHybridRows();
    const started = performance.now();
    const model = trainUserLabelHybridModel(rows);
    const elapsedMs = performance.now() - started;
    expect(model).not.toBeNull();
    expect(
      elapsedMs,
      `label-hybrid realistic fixture train time: ${elapsedMs.toFixed(1)}ms (${String(rows.length)} rows)`
    ).toBeLessThan(60_000);
  });

  it('cache reaches ready after warm without poll debounce starvation', async () => {
    const rows = buildRealisticLabelHybridRows();
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer(new InlineLabelHybridTrainer());
    const userId = 'fixture-realistic';

    const started = performance.now();
    cache.scheduleHybridWarm(userId, rows);

    let ready = false;
    for (let attempt = 0; attempt < 600; attempt += 1) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      if (!cache.shouldReturnWarmingResponse(userId, rows)) {
        ready = true;
        break;
      }
    }
    const elapsedMs = performance.now() - started;

    expect(ready).toBe(true);
    expect(cache.resolveModelForInference(userId, rows)).not.toBeNull();
    expect(
      elapsedMs,
      `label-hybrid realistic fixture time-to-ready: ${elapsedMs.toFixed(1)}ms`
    ).toBeLessThan(60_000);
  }, 65_000);
});
