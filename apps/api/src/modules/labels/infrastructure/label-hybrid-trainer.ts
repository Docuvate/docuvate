// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Worker } from 'node:worker_threads';

import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import { trainUserLabelHybridModel } from '../domain/label-hybrid-training.js';
import { resolveLabelHybridWorkerModule } from './label-hybrid-worker-url.js';

export interface LabelHybridTrainer {
  train(rows: readonly LabelHybridDocumentRow[]): Promise<LabelHybridModel | null>;
}

export function trainInWorkerThread(
  rows: readonly LabelHybridDocumentRow[]
): Promise<LabelHybridModel | null> {
  const resolved = resolveLabelHybridWorkerModule('label-hybrid-train.worker');
  return new Promise((resolve, reject) => {
    const worker = new Worker(resolved.filename, {
      workerData: { rows: [...rows] },
      execArgv: resolved.execArgv,
    });
    worker.once('message', (message: LabelHybridModel | null) => {
      resolve(message);
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`label hybrid train worker exited with code ${String(code)}`));
      }
    });
  });
}

export class WorkerThreadLabelHybridTrainer implements LabelHybridTrainer {
  async train(rows: readonly LabelHybridDocumentRow[]): Promise<LabelHybridModel | null> {
    return trainInWorkerThread(rows);
  }
}

/** Synchronous trainer for unit tests (same thread, no worker spawn). */
export class InlineLabelHybridTrainer implements LabelHybridTrainer {
  train(rows: readonly LabelHybridDocumentRow[]): Promise<LabelHybridModel | null> {
    return Promise.resolve(trainUserLabelHybridModel(rows));
  }
}
