// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ExtractionReconcileStatus = 'queued' | 'extracting';

export interface ExtractionReconcileDocument {
  id: string;
  userId: string;
  status: ExtractionReconcileStatus;
}

/** BullMQ/Redis lease for one document. `startedAtMs` is processedOn / recorded start, never created/updated_at. */
export interface ExtractionReconcileJob {
  live: boolean;
  startedAtMs: number | null;
}

export interface ExtractionReconcilePlan {
  failIds: string[];
  enqueue: { id: string; userId: string }[];
}

/**
 * Queued backlog is never failed by age (one extract slot can wait for hours).
 * Orphaned queued rows (no live job) are re-enqueued.
 * Extracting fails only when the lease started past the deadline and the job is not live.
 */
export function planExtractionReconcile(
  docs: readonly ExtractionReconcileDocument[],
  jobs: ReadonlyMap<string, ExtractionReconcileJob>,
  nowMs: number,
  deadlineMs: number
): ExtractionReconcilePlan {
  const failIds: string[] = [];
  const enqueue: { id: string; userId: string }[] = [];
  for (const doc of docs) {
    const job = jobs.get(doc.id);
    switch (doc.status) {
      case 'queued': {
        if (!job?.live) {
          enqueue.push({ id: doc.id, userId: doc.userId });
        }
        break;
      }
      case 'extracting': {
        if (job?.live) {
          break;
        }
        const startedAtMs = job?.startedAtMs ?? null;
        if (startedAtMs !== null && nowMs - startedAtMs >= deadlineMs) {
          failIds.push(doc.id);
        }
        break;
      }
      default: {
        const exhaustive: never = doc.status;
        throw new Error(`unexpected extraction reconcile status: ${String(exhaustive)}`);
      }
    }
  }
  return { failIds, enqueue };
}
