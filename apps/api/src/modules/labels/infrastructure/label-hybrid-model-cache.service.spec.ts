// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { LabelHybridModelCacheService } from './label-hybrid-model-cache.service.js';
import {
  LabelHybridTrainBudgetExceededError,
  type LabelHybridTrainer,
} from './label-hybrid-trainer.js';

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

function seedLabeledCorpus(
  tagA: number,
  tagB: number,
  prefix: string
): LabelHybridDocumentRow[] {
  const rows: LabelHybridDocumentRow[] = [];
  for (let i = 0; i < tagA; i += 1) {
    rows.push(labeledRow(`${prefix}-a-${String(i)}`, 'payroll', `payroll ${String(i)}`));
  }
  for (let i = 0; i < tagB; i += 1) {
    rows.push(labeledRow(`${prefix}-b-${String(i)}`, 'tax', `tax ${String(i)}`));
  }
  return rows;
}

async function flushHybridTrainTimers(debounceMs: number, intervalMs: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(debounceMs);
  await vi.advanceTimersByTimeAsync(intervalMs);
  await Promise.resolve();
}

describe('LabelHybridModelCacheService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'] = '100';
    process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA'] = '5';
    process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA_RATIO'] = '0.02';
    process.env['DOCUVATE_LABEL_RETRAIN_MIN_INTERVAL_MS'] = '1000';
    process.env['DOCUVATE_LABEL_HYBRID_TRAIN_BUDGET_MS'] = '60000';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'];
    delete process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA'];
    delete process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA_RATIO'];
    delete process.env['DOCUVATE_LABEL_RETRAIN_MIN_INTERVAL_MS'];
    delete process.env['DOCUVATE_LABEL_HYBRID_TRAIN_BUDGET_MS'];
  });

  it('calls training at most once while label assignments are unchanged', async () => {
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const trainer: LabelHybridTrainer = { train };
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer(trainer);

    const baseRows: LabelHybridDocumentRow[] = [
      ...seedLabeledCorpus(2, 2, 'base'),
      {
        documentId: 'd5',
        embedding: [0.3, 0.4],
        nonInboxTagIds: [],
        text: 'unlabeled new extraction',
      },
    ];

    const userId = 'user-1';
    const revision = cache.revisionForRows(baseRows);

    await cache.resolveModel(userId, baseRows);
    await flushHybridTrainTimers(100, 0);
    expect(train).toHaveBeenCalledTimes(1);

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

  it('does not retrain when confirmed label delta is below threshold', async () => {
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-threshold';
    const v1 = seedLabeledCorpus(5, 5, 't');
    await cache.resolveModel(userId, v1);
    await flushHybridTrainTimers(100, 0);
    expect(train).toHaveBeenCalledTimes(1);

    const v2 = [...v1, labeledRow('extra', 'payroll', 'one more')];
    await cache.resolveModel(userId, v2);
    await flushHybridTrainTimers(100, 2000);
    expect(train).toHaveBeenCalledTimes(1);
  });

  it('retrains after min interval when threshold is eventually met', async () => {
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-trailing';
    const v1 = seedLabeledCorpus(5, 5, 'trail');
    await cache.resolveModel(userId, v1);
    await flushHybridTrainTimers(100, 0);
    expect(train).toHaveBeenCalledTimes(1);

    const v2 = [
      ...v1,
      labeledRow('n1', 'payroll', 'a'),
      labeledRow('n2', 'payroll', 'b'),
      labeledRow('n3', 'payroll', 'c'),
      labeledRow('n4', 'payroll', 'd'),
      labeledRow('n5', 'payroll', 'e'),
    ];
    await cache.resolveModel(userId, v2);
    await flushHybridTrainTimers(100, 0);
    expect(train).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    await Promise.resolve();
    expect(train).toHaveBeenCalledTimes(2);
  });

  it('resolveModelForInference returns stale model without awaiting in-flight training', async () => {
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
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-inference';
    const rowsV1 = seedLabeledCorpus(5, 5, 'infer');
    await cache.resolveModel(userId, rowsV1);
    await flushHybridTrainTimers(100, 0);

    const rowsV2 = [
      ...rowsV1,
      labeledRow('infer-new', 'brand-new-class', 'material change'),
    ];
    void cache.resolveModel(userId, rowsV2);
    await flushHybridTrainTimers(100, 1000);
    expect(train).toHaveBeenCalledTimes(2);

    const peeked = cache.resolveModelForInference(userId, rowsV2);
    expect(peeked).toEqual(stubModel);
    resolveTrain?.({ ...stubModel, confidenceThreshold: 0.75 });
    await Promise.resolve();
  });

  it('serves stale model while a significant revision trains in the background', async () => {
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
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-2';
    const rowsV1 = seedLabeledCorpus(5, 5, 'stale');
    await cache.resolveModel(userId, rowsV1);
    await flushHybridTrainTimers(100, 0);
    expect(train).toHaveBeenCalledTimes(1);

    const rowsV2 = [
      ...rowsV1,
      labeledRow('a5', 'brand-new-class', 'five labeled change'),
    ];
    const stale = await cache.resolveModel(userId, rowsV2);
    expect(stale).toEqual(stubModel);
    await flushHybridTrainTimers(100, 1000);
    expect(train).toHaveBeenCalledTimes(2);

    const updated: LabelHybridModel = { ...stubModel, confidenceThreshold: 0.88 };
    resolveTrain?.(updated);
    await Promise.resolve();

    const fresh = await cache.resolveModel(userId, rowsV2);
    expect(fresh?.confidenceThreshold).toBe(0.88);
  });

  it('serves a capped fast model when training exceeds the wall-clock budget on cold start', async () => {
    let calls = 0;
    const train = vi.fn((): Promise<LabelHybridModel | null> => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new LabelHybridTrainBudgetExceededError(50));
      }
      return Promise.resolve(stubModel);
    });
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-budget-fallback';
    const rows = seedLabeledCorpus(5, 5, 'budget-fallback');
    void cache.resolveModel(userId, rows);
    await flushHybridTrainTimers(100, 0);
    const model = await cache.resolveModel(userId, rows);
    expect(model).not.toBeNull();
    expect(cache.shouldReturnWarmingResponse(userId, rows)).toBe(false);
  });

  it('keeps the previous model when training exceeds the wall-clock budget', async () => {
    let calls = 0;
    const train = vi.fn((): Promise<LabelHybridModel | null> => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(stubModel);
      }
      return Promise.reject(new LabelHybridTrainBudgetExceededError(50));
    });
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-budget';
    const rowsV1 = seedLabeledCorpus(5, 5, 'budget');
    await cache.resolveModel(userId, rowsV1);
    await flushHybridTrainTimers(100, 0);
    expect(train).toHaveBeenCalledTimes(1);

    const rowsV2 = [
      ...rowsV1,
      labeledRow('n1', 'new-class', 'a'),
      labeledRow('n2', 'new-class', 'b'),
    ];
    const stale = await cache.resolveModel(userId, rowsV2);
    expect(stale).toEqual(stubModel);
    await flushHybridTrainTimers(100, 1000);
    expect(train).toHaveBeenCalledTimes(2);

    const afterBudget = await cache.resolveModel(userId, rowsV2);
    expect(afterBudget).toEqual(stubModel);
  });

  it('does not reset debounce when the same revision is scheduled on a poll interval', async () => {
    process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'] = '45_000';
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-poll-debounce';
    const rows = seedLabeledCorpus(5, 5, 'poll');
    cache.scheduleHybridWarm(userId, rows);

    for (let poll = 0; poll < 10; poll += 1) {
      cache.scheduleHybridWarm(userId, rows);
      await vi.advanceTimersByTimeAsync(4_000);
    }
    expect(train).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5_000);
    await flushHybridTrainTimers(0, 0);
    expect(train).toHaveBeenCalledTimes(1);
    delete process.env['LABEL_HYBRID_TRAIN_DEBOUNCE_MS'];
  });

  it('shouldReturnWarmingResponse is true on cold start and false after the model is cached', async () => {
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });
    const userId = 'user-warm-flag';
    const rows = seedLabeledCorpus(5, 5, 'warm');
    expect(cache.shouldReturnWarmingResponse(userId, rows)).toBe(true);
    await cache.resolveModel(userId, rows);
    await flushHybridTrainTimers(100, 0);
    expect(cache.shouldReturnWarmingResponse(userId, rows)).toBe(false);
  });

  it('coalesces fifty rapid revision bumps into at most two trainings', async () => {
    const train = vi.fn((): Promise<LabelHybridModel | null> => Promise.resolve(stubModel));
    const cache = new LabelHybridModelCacheService();
    cache.replaceTrainer({ train });

    const userId = 'user-burst';
    let rows = seedLabeledCorpus(5, 5, 'burst');
    await cache.resolveModel(userId, rows);
    await flushHybridTrainTimers(100, 0);

    for (let i = 0; i < 50; i += 1) {
      rows = [
        ...rows,
        labeledRow(`rapid-${String(i)}`, 'payroll', `rapid ${String(i)}`),
      ];
      await cache.resolveModel(userId, rows);
      await vi.advanceTimersByTimeAsync(5);
    }
    await flushHybridTrainTimers(100, 1000);
    expect(train.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
