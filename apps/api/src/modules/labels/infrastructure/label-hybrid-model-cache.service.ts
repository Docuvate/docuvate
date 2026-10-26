// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger } from '@nestjs/common';

import type { LabelHybridModel } from '../domain/label-hybrid-auto-match.js';
import {
  baselineFromTrainedRows,
  emptyRetrainBaseline,
  evaluateRetrainSignificance,
  type LabelHybridRetrainBaseline,
} from '../domain/label-hybrid-retrain-policy.js';
import { computeLabelHybridTrainingRevision } from '../domain/label-hybrid-revision.js';
import type { LabelHybridDocumentRow } from '../domain/label-hybrid-training.js';
import {
  labelHybridRetrainMinIntervalMs,
  labelHybridTrainBudgetMs,
  labelHybridTrainDebounceMs,
} from '../domain/label-hybrid-training-config.js';
import {
  InlineLabelHybridTrainer,
  LabelHybridTrainBudgetExceededError,
  type LabelHybridTrainer,
  WorkerThreadLabelHybridTrainer,
} from './label-hybrid-trainer.js';

interface UserHybridCacheEntry {
  revision: string | null;
  model: LabelHybridModel | null;
  retrainBaseline: LabelHybridRetrainBaseline;
  lastTrainedAtMs: number | null;
  pendingRows: LabelHybridDocumentRow[] | null;
  pendingRevision: string | null;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  intervalTimer: ReturnType<typeof setTimeout> | null;
  trainingPromise: Promise<LabelHybridModel | null> | null;
}

function countTrainingExamples(rows: readonly LabelHybridDocumentRow[]): number {
  let count = 0;
  for (const row of rows) {
    if (row.embedding.length === 0) {
      continue;
    }
    count += row.nonInboxTagIds.length;
  }
  return count;
}

function createCacheEntry(): UserHybridCacheEntry {
  return {
    revision: null,
    model: null,
    retrainBaseline: emptyRetrainBaseline(),
    lastTrainedAtMs: null,
    pendingRows: null,
    pendingRevision: null,
    debounceTimer: null,
    intervalTimer: null,
    trainingPromise: null,
  };
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
   * Returns a cached model for inference. Retrains off-thread (debounced, threshold-gated,
   * rate-limited, single-flight globally) when user-confirmed labels change materially.
   */
  /**
   * Returns the best model available for inference without waiting on an in-flight retrain.
   * Schedules background training when the confirmed-label revision changes.
   */
  resolveModelForInference(
    userId: string,
    rows: readonly LabelHybridDocumentRow[]
  ): LabelHybridModel | null {
    const revision = computeLabelHybridTrainingRevision(rows);
    const entry = this.entries.get(userId) ?? createCacheEntry();
    this.entries.set(userId, entry);

    if (entry.revision === revision) {
      return entry.model;
    }

    const staleModel = entry.model;
    this.scheduleDebouncedTrain(userId, entry, rows, revision);
    return staleModel;
  }

  async resolveModel(
    userId: string,
    rows: readonly LabelHybridDocumentRow[]
  ): Promise<LabelHybridModel | null> {
    const revision = computeLabelHybridTrainingRevision(rows);
    const entry = this.entries.get(userId) ?? createCacheEntry();
    this.entries.set(userId, entry);

    if (entry.revision === revision) {
      return entry.model;
    }

    const staleModel = entry.model;
    this.scheduleDebouncedTrain(userId, entry, rows, revision);

    if (staleModel) {
      return staleModel;
    }

    return null;
  }

  /**
   * True when hybrid assign scoring must wait for a first model and training should run off-request.
   */
  shouldReturnWarmingResponse(
    userId: string,
    rows: readonly LabelHybridDocumentRow[]
  ): boolean {
    const revision = computeLabelHybridTrainingRevision(rows);
    const entry = this.entries.get(userId) ?? createCacheEntry();
    this.entries.set(userId, entry);

    if (entry.revision === revision) {
      return false;
    }
    if (entry.model !== null) {
      return false;
    }
    const significance = evaluateRetrainSignificance(entry.retrainBaseline, rows);
    return significance !== null;
  }

  scheduleHybridWarm(userId: string, rows: readonly LabelHybridDocumentRow[]): void {
    this.resolveModelForInference(userId, rows);
  }

  private scheduleDebouncedTrain(
    userId: string,
    entry: UserHybridCacheEntry,
    rows: readonly LabelHybridDocumentRow[],
    revision: string
  ): void {
    entry.pendingRows = [...rows];
    entry.pendingRevision = revision;
    if (entry.trainingPromise) {
      return;
    }
    if (entry.debounceTimer) {
      clearTimeout(entry.debounceTimer);
    }
    entry.debounceTimer = setTimeout(() => {
      entry.debounceTimer = null;
      void this.startTrainingIfNeeded(userId, entry);
    }, labelHybridTrainDebounceMs());
  }

  private scheduleIntervalRetry(userId: string, entry: UserHybridCacheEntry, delayMs: number): void {
    if (delayMs <= 0) {
      void this.startTrainingIfNeeded(userId, entry);
      return;
    }
    if (entry.intervalTimer) {
      clearTimeout(entry.intervalTimer);
    }
    entry.intervalTimer = setTimeout(() => {
      entry.intervalTimer = null;
      void this.startTrainingIfNeeded(userId, entry);
    }, delayMs);
  }

  private msUntilRetrainAllowed(entry: UserHybridCacheEntry, coldStart: boolean): number {
    if (coldStart) {
      return 0;
    }
    if (entry.lastTrainedAtMs === null) {
      return 0;
    }
    const elapsed = Date.now() - entry.lastTrainedAtMs;
    const minInterval = labelHybridRetrainMinIntervalMs();
    return Math.max(0, minInterval - elapsed);
  }

  private async startTrainingIfNeeded(
    userId: string,
    entry: UserHybridCacheEntry
  ): Promise<void> {
    if (entry.trainingPromise) {
      return;
    }
    const rows = entry.pendingRows;
    const revision = entry.pendingRevision;
    if (!rows || !revision || entry.revision === revision) {
      return;
    }

    const significance = evaluateRetrainSignificance(entry.retrainBaseline, rows);
    if (significance === null) {
      return;
    }

    const coldStart = significance.kind === 'cold_start';
    const waitMs = this.msUntilRetrainAllowed(entry, coldStart);
    if (waitMs > 0) {
      this.scheduleIntervalRetry(userId, entry, waitMs);
      return;
    }

    const exampleCount = countTrainingExamples(rows);
    const started = performance.now();
    const budgetMs = labelHybridTrainBudgetMs();
    entry.trainingPromise = this.trainer
      .train(rows, { userId, revision, exampleCount, budgetMs })
      .then((model) => {
        const durationMs = performance.now() - started;
        this.logger.debug(
          `Label hybrid train user=${userId} revisionLen=${String(revision.length)} examples=${String(exampleCount)} durationMs=${durationMs.toFixed(1)} significance=${significance.kind}`
        );
        entry.lastTrainedAtMs = Date.now();
        entry.revision = revision;
        entry.model = model;
        entry.retrainBaseline = baselineFromTrainedRows(rows);
        entry.trainingPromise = null;
        const followRevision = entry.pendingRevision;
        const followRows = entry.pendingRows;
        if (
          followRevision !== null &&
          followRows !== null &&
          followRevision !== revision
        ) {
          void this.startTrainingIfNeeded(userId, entry);
        } else {
          entry.pendingRows = null;
          entry.pendingRevision = null;
        }
        return model;
      })
      .catch((error: unknown) => {
        entry.trainingPromise = null;
        if (error instanceof LabelHybridTrainBudgetExceededError) {
          this.logger.warn(
            `Label hybrid training budget exceeded for user ${userId}; keeping previous model`
          );
          this.scheduleIntervalRetry(userId, entry, labelHybridRetrainMinIntervalMs());
          return entry.model;
        }
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Label hybrid training failed for user ${userId}: ${message}`);
        return entry.model;
      });
    await entry.trainingPromise;
  }
}
