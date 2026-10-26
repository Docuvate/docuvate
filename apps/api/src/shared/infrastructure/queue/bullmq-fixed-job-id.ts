// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Job, Queue } from 'bullmq';

type BullFixedIdJob = Pick<Job, 'getState' | 'retry' | 'remove'>;
type BullFixedIdQueue = Pick<Queue, 'getJob'>;

const QUEUED_JOB_STATES = new Set([
  'active',
  'waiting',
  'delayed',
  'prioritized',
  'waiting-children',
]);

export function isBullJobQueuedState(state: string): boolean {
  return QUEUED_JOB_STATES.has(state);
}

/** Remove failed/completed (or unknown) jobs so `queue.add` with the same `jobId` can succeed. */
export async function clearStaleBullJobForFixedId(job: BullFixedIdJob): Promise<void> {
  const state = await job.getState();
  if (isBullJobQueuedState(state)) {
    return;
  }
  if (state === 'failed') {
    try {
      await job.retry();
      const afterRetry = await job.getState();
      if (isBullJobQueuedState(afterRetry)) {
        return;
      }
    } catch {
      // fall through to remove
    }
  }
  await job.remove();
}

export async function prepareBullFixedJobIdForAdd(
  queue: BullFixedIdQueue,
  jobId: string
): Promise<'add' | 'already-queued'> {
  const existing = await queue.getJob(jobId);
  if (!existing) {
    return 'add';
  }
  const state = await existing.getState();
  if (isBullJobQueuedState(state)) {
    return 'already-queued';
  }
  await clearStaleBullJobForFixedId(existing);
  const after = await queue.getJob(jobId);
  if (after) {
    const afterState = await after.getState();
    if (isBullJobQueuedState(afterState)) {
      return 'already-queued';
    }
    await after.remove();
  }
  return 'add';
}

export async function assertBullFixedJobIdQueued(queue: BullFixedIdQueue, jobId: string): Promise<void> {
  const job = await queue.getJob(jobId);
  if (!job) {
    throw new Error(`BullMQ job ${jobId} missing after enqueue`);
  }
  const state = await job.getState();
  if (!isBullJobQueuedState(state)) {
    throw new Error(`BullMQ job ${jobId} not queued (state=${state})`);
  }
}
