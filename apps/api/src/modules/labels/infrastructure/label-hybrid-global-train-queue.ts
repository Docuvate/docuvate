// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

let activeTrain: Promise<void> | null = null;
const pendingRuns: (() => void)[] = [];

function drainTrainQueue(): void {
  if (activeTrain !== null || pendingRuns.length === 0) {
    return;
  }
  const next = pendingRuns.shift();
  if (!next) {
    return;
  }
  next();
}

/** Runs at most one hybrid training worker job at a time across all tenants. */
export function runExclusiveLabelHybridTrain<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = (): void => {
      activeTrain = task()
        .then(
          (value) => {
            resolve(value);
          },
          (error: unknown) => {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        )
        .finally(() => {
          activeTrain = null;
          drainTrainQueue();
        })
        .then(() => undefined);
    };
    if (activeTrain === null) {
      run();
      return;
    }
    pendingRuns.push(run);
  });
}

/** @internal test hook */
export function resetExclusiveLabelHybridTrainQueue(): void {
  activeTrain = null;
  pendingRuns.length = 0;
}
