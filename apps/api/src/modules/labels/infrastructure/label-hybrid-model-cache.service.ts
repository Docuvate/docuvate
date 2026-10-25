// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger } from '@nestjs/common';

import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import { computeLabelHybridTrainingRevision } from '../domain/label-hybrid-revision.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import {
  InlineLabelHybridTrainer,
  type LabelHybridTrainer,
  WorkerThreadLabelHybridTrainer,
} from './label-hybrid-trainer.js';

interface UserHybridCacheEntry {
  revision: string | null;
  model: LabelHybridModel | null;
  pendingRevision: string | null;
  pendingPromise: Promise<LabelHybridModel | null> | null;
}

@Injectable()
export class LabelHybridModelCacheService {
  private readonly logger = new Logger(LabelHybridModelCacheService.name);
  private readonly entries = new Map<string, UserHybridCacheEntry>();
  private trainer: LabelHybridTrainer;

  constructor() {
    this.trainer =
      process.env['LABEL_HYBRID_TRAIN_INLINE'] === '1'
        ? new InlineLabelHybridTrainer()
        : new WorkerThreadLabelHybridTrainer();
  }

  /** @internal test hook */
  replaceTrainer(trainer: LabelHybridTrainer): void {
    this.trainer = trainer;
  }

  revisionForRows(rows: readonly LabelHybridDocumentRow[]): string {
    return computeLabelHybridTrainingRevision(rows);
  }

  /**
   * Returns a cached model for inference. When training data changed, serves the previous model
   * while retraining off the event loop; returns null when no model exists yet.
   */
  async resolveModel(
    userId: string,
    rows: readonly LabelHybridDocumentRow[]
  ): Promise<LabelHybridModel | null> {
    const revision = computeLabelHybridTrainingRevision(rows);
    const entry = this.entries.get(userId) ?? {
      revision: null,
      model: null,
      pendingRevision: null,
      pendingPromise: null,
    };
    this.entries.set(userId, entry);

    if (entry.revision === revision) {
      return entry.model;
    }

    const staleModel = entry.model;

    if (entry.pendingRevision === revision && entry.pendingPromise) {
      if (staleModel) {
        return staleModel;
      }
      return entry.pendingPromise;
    }

    entry.pendingRevision = revision;
    entry.pendingPromise = this.trainer
      .train(rows)
      .then((model) => {
        entry.revision = revision;
        entry.model = model;
        entry.pendingRevision = null;
        entry.pendingPromise = null;
        return model;
      })
      .catch((error: unknown) => {
        entry.pendingRevision = null;
        entry.pendingPromise = null;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Label hybrid training failed for user ${userId}: ${message}`);
        return staleModel;
      });

    if (staleModel) {
      void entry.pendingPromise;
      return staleModel;
    }

    return entry.pendingPromise;
  }
}
