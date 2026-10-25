// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { LabelHybridModelCacheService } from './label-hybrid-model-cache.service.js';
import type { LabelHybridTrainer } from './label-hybrid-trainer.js';

const stubModel: LabelHybridModel = {
  tagIds: ['a', 'b'],
  vocabulary: ['x'],
  idf: [1],
  weightRows: [[1], [0]],
  embedDim: 2,
  confidenceThreshold: 0.9,
  classGates: [],
};

function labeledRow(documentId: string, tagId: string, text: string): LabelHybridDocumentRow {
  return {
    documentId,
    embedding: [0.1, 0.2],
    nonInboxTagIds: [tagId],
    text,
  };
}

describe('LabelHybridModelCacheService', () => {
  it('calls training at most once while label assignments are unchanged', async () => {
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const trainer: LabelHybridTrainer = { train };
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer(trainer);

    const baseRows: LabelHybridDocumentRow[] = [
      labeledRow('d1', 'payroll', 'alpha payroll text'),
      labeledRow('d2', 'payroll', 'beta payroll text'),
      labeledRow('d3', 'tax', 'gamma tax text'),
      labeledRow('d4', 'tax', 'delta tax text'),
      {
        documentId: 'd5',
        embedding: [0.3, 0.4],
        nonInboxTagIds: [],
        text: 'unlabeled new extraction',
      },
    ];

    const userId = 'user-1';
    const revision = cache.revisionForRows(baseRows);

    for (let i = 0; i < 12; i += 1) {
      const rows: LabelHybridDocumentRow[] = [
        ...baseRows.slice(0, 4),
        {
          documentId: `new-${String(i)}`,
          embedding: [0.5, 0.6],
          nonInboxTagIds: [],
          text: `fresh unlabeled document ${String(i)}`,
        },
      ];
      expect(cache.revisionForRows(rows)).toBe(revision);
      const model = await cache.resolveModel(userId, rows);
      expect(model).toEqual(stubModel);
    }

    expect(train).toHaveBeenCalledTimes(1);
  });

  it('serves stale model while a new revision trains in the background', async () => {
    let resolveTrain: ((model: LabelHybridModel | null) => void) | undefined;
    let trainCalls = 0;
    const train = vi.fn((): Promise<LabelHybridModel | null> => {
      trainCalls += 1;
      if (trainCalls === 1) {
        return Promise.resolve(stubModel);
      }
      return new Promise((resolve) => {
        resolveTrain = resolve;
      });
    });
    const trainer: LabelHybridTrainer = { train };
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer(trainer);

    const userId = 'user-2';
    const rowsV1: LabelHybridDocumentRow[] = [
      labeledRow('a1', 'payroll', 'one'),
      labeledRow('a2', 'payroll', 'two'),
      labeledRow('a3', 'tax', 'three'),
      labeledRow('a4', 'tax', 'four'),
    ];
    const first = await cache.resolveModel(userId, rowsV1);
    expect(first).toEqual(stubModel);
    expect(train).toHaveBeenCalledTimes(1);

    const rowsV2: LabelHybridDocumentRow[] = [
      ...rowsV1,
      labeledRow('a5', 'tax', 'five labeled change'),
    ];
    const stale = await cache.resolveModel(userId, rowsV2);
    expect(stale).toEqual(stubModel);
    expect(train).toHaveBeenCalledTimes(2);

    const updated: LabelHybridModel = { ...stubModel, confidenceThreshold: 0.88 };
    resolveTrain?.(updated);
    await new Promise((r) => setTimeout(r, 0));

    const fresh = await cache.resolveModel(userId, rowsV2);
    expect(fresh?.confidenceThreshold).toBe(0.88);
  });
});
