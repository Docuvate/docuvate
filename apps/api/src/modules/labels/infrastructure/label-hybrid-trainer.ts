// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Worker } from 'node:worker_threads';

import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { trainUserLabelHybridModel } from '../domain/label-hybrid-training.js';
import { labelHybridTrainBudgetMs } from '../domain/label-hybrid-training-config.js';
import { runExclusiveLabelHybridTrain } from './label-hybrid-global-train-queue.js';
import { resolveLabelHybridWorkerModule } from './label-hybrid-worker-url.js';

export class LabelHybridTrainBudgetExceededError extends Error {
  constructor(budgetMs: number) {
    super(`label hybrid training exceeded budget of ${String(budgetMs)}ms`);
    this.name = 'LabelHybridTrainBudgetExceededError';
  }
}

export interface LabelHybridTrainer {
  train(
    rows: readonly LabelHybridDocumentRow[],
    context: {
      userId: string;
      revision: string;
      exampleCount: number;
      budgetMs: number;
    }
  ): Promise<LabelHybridModel | null>;
}

const WORKER_RESOURCE_LIMITS = {
  maxOldGenerationSizeMb: 256,
  maxYoungGenerationSizeMb: 32,
};

export function trainInWorkerThread(
  rows: readonly LabelHybridDocumentRow[],
  budgetMs: number = labelHybridTrainBudgetMs()
): Promise<LabelHybridModel | null> {
  const resolved = resolveLabelHybridWorkerModule('label-hybrid-train.worker');
  return runExclusiveLabelHybridTrain(
    () =>
      new Promise((resolve, reject) => {
        let settled = false;
        let budgetTimer: ReturnType<typeof setTimeout> | null = null;
        const worker = new Worker(resolved.filename, {
          workerData: { rows: [...rows], budgetMs },
          execArgv: resolved.execArgv,
          resourceLimits: WORKER_RESOURCE_LIMITS,
        });
        const finish = (handler: () => void): void => {
          if (settled) {
            return;
          }
          settled = true;
          if (budgetTimer !== null) {
            clearTimeout(budgetTimer);
            budgetTimer = null;
          }
          handler();
        };
        if (budgetMs > 0) {
          const hardStopMs = budgetMs + Math.min(15_000, Math.floor(budgetMs * 0.25));
          budgetTimer = setTimeout(() => {
            void worker.terminate();
            finish(() => {
              reject(new LabelHybridTrainBudgetExceededError(budgetMs));
            });
          }, hardStopMs);
        }
        worker.once('message', (message: LabelHybridModel | null) => {
          finish(() => {
            resolve(message);
          });
        });
        worker.once('error', (error: Error) => {
          finish(() => {
            reject(error);
          });
        });
        worker.once('exit', (code) => {
          finish(() => {
            if (code !== 0 && code !== 1) {
              reject(new Error(`label hybrid train worker exited with code ${String(code)}`));
            }
          });
        });
      })
  );
}

export class WorkerThreadLabelHybridTrainer implements LabelHybridTrainer {
  train(
    rows: readonly LabelHybridDocumentRow[],
    context: { userId: string; revision: string; exampleCount: number; budgetMs: number }
  ): Promise<LabelHybridModel | null> {
    return trainInWorkerThread(rows, context.budgetMs);
  }
}

/** Synchronous trainer for unit tests (same thread, no worker spawn). */
export class InlineLabelHybridTrainer implements LabelHybridTrainer {
  train(
    rows: readonly LabelHybridDocumentRow[],
    context: { userId: string; revision: string; exampleCount: number; budgetMs: number }
  ): Promise<LabelHybridModel | null> {
    const started = performance.now();
    const shouldAbort = (): boolean => {
      if (context.budgetMs <= 0) {
        return false;
      }
      return performance.now() - started >= context.budgetMs;
    };
    return Promise.resolve(trainUserLabelHybridModel(rows, { shouldAbort }));
  }
}
