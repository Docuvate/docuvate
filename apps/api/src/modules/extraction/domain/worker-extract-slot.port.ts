// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface WorkerExtractSlotPort {
  /**
   * Runs `run` while holding one worker extract slot. Re-entrant: a call made
   * inside an async context that already holds a slot runs without acquiring a
   * second one, so nested worker calls in one extraction job cannot deadlock.
   */
  runWithSlot<T>(run: () => Promise<T>): Promise<T>;
  onWorkerPressure503(retryAfterSeconds: number): void;
}
