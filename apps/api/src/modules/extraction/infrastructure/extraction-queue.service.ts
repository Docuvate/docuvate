// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { type Job, Queue, UnrecoverableError, Worker } from 'bullmq';
import type IORedis from 'ioredis';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  JOB_OUTBOX_REPOSITORY,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import { parseString, requireRecord } from '../../../shared/domain/row-parse.js';
import { arenaSampleRate } from '../../../shared/infrastructure/arena/arena-sample-config.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  assertBullFixedJobIdQueued,
  isBullJobQueuedState,
  prepareBullFixedJobIdForAdd,
} from '../../../shared/infrastructure/queue/bullmq-fixed-job-id.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import { RunArenaSampleCompareUseCase } from '../../documents/application/run-arena-sample-compare.use-case.js';
import { RunExtractionUseCase } from '../../documents/application/run-extraction.use-case.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { extractionDeadlineMaxRetries } from '../domain/extraction-deadline.config.js';
import { toExtractionFailure } from '../domain/extraction-failure.js';
import {
  documentExtractionConcurrency,
  extractionJobId,
  extractionQueueLockDurationMs,
  extractionQueueMaxStalledCount,
  extractionQueueStalledIntervalMs,
} from '../domain/extraction-queue.config.js';
import {
  planExtractionAttemptFailure,
  planExtractionJobFailed,
  planProcessorFailure,
  shouldPersistTerminalExtractionFailure,
} from '../domain/plan-extraction-job-failure.js';
import type { ExtractionReconcileJob } from '../domain/plan-extraction-reconcile.js';
import { WorkerExtractCapacityCoordinator } from './worker-extract-capacity.coordinator.js';

export interface ExtractionOutboxJobPayload {
  outboxId: string;
  documentId: string;
  userId: string;
}

function parseExtractionJobDocumentId(data: unknown): string {
  const row = requireRecord(data);
  const documentId = parseString(row.documentId).trim();
  if (!documentId) {
    throw new Error('document-extraction job missing documentId');
  }
  return documentId;
}

function readOutboxPayload(data: unknown): ExtractionOutboxJobPayload | null {
  const row = requireRecord(data);
  const outboxId = parseString(row.outboxId).trim();
  const documentId = parseString(row.documentId).trim();
  const userId = parseString(row.userId).trim();
  if (!outboxId || !documentId || !userId) {
    return null;
  }
  return { outboxId, documentId, userId };
}

const QUEUE_NAME = 'document-extraction';
const ARENA_COUNTER_KEY = 'arena:sample:counter';
const EXTRACT_STARTED_KEY_PREFIX = 'document-extract-started:';
const EXTRACT_STARTED_TTL_SECONDS = 24 * 60 * 60;

function extractionStartedRedisKey(documentId: string): string {
  return `${EXTRACT_STARTED_KEY_PREFIX}${documentId}`;
}

function isLiveExtractionJobState(state: string): boolean {
  switch (state) {
    case 'active':
    case 'waiting':
    case 'delayed':
    case 'paused':
    case 'waiting-children':
    case 'prioritized':
      return true;
    case 'completed':
    case 'failed':
    case 'unknown':
      return false;
    default:
      return false;
  }
}

const ORPHAN_REQUEUE_COUNTER_TTL_SECONDS = 7 * 24 * 60 * 60;

function orphanRequeueKey(documentId: string): string {
  return `docuvate:extraction:orphan-requeues:${documentId}`;
}

@Injectable()
export class ExtractionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExtractionQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;
  private ready = false;

  constructor(
    private readonly runExtraction: RunExtractionUseCase,
    private readonly runArenaSample: RunArenaSampleCompareUseCase,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase,
    private readonly extractCapacity: WorkerExtractCapacityCoordinator,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(JOB_OUTBOX_REPOSITORY) private readonly outbox: JobOutboxRepository
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const documentId = parseExtractionJobDocumentId(job.data);
        if (job.name === 'arena-sample') {
          await this.runArenaSample.execute(documentId);
          return;
        }
        const payload = readOutboxPayload(job.data);
        const userIdRaw = payload?.userId ?? parseString(requireRecord(job.data).userId).trim();
        const userId = userIdRaw.length > 0 ? userIdRaw : null;
        await this.extractCapacity.runWithSlot(async () => {
          const outboxId = await this.resolveOutboxId(payload, documentId);
          if (outboxId) {
            const existing = await this.outbox.findById(outboxId);
            if (existing?.status === 'done' || existing?.status === 'failed') {
              this.logger.debug(`Skipping terminal outbox ${outboxId} (${existing.status})`);
              return;
            }
            const started = await this.outbox.markRunning(outboxId);
            if (!started) {
              const again = await this.outbox.findById(outboxId);
              if (
                again?.status === 'done' ||
                again?.status === 'failed' ||
                again?.status === 'running'
              ) {
                return;
              }
              throw new Error(
                `Unable to mark outbox ${outboxId} running (status=${again?.status ?? 'missing'})`
              );
            }
          }

          try {
            await this.recordExtractionStart(documentId);
            await this.runExtraction.execute(documentId);
            if (outboxId) {
              await this.outbox.markDone(outboxId);
            }
          } catch (error: unknown) {
            const failure = toExtractionFailure(error);
            const plan = planProcessorFailure({
              failure,
              attemptsMade: job.attemptsMade,
              deadlineMaxRetries: extractionDeadlineMaxRetries(),
            });
            if (outboxId) {
              const after = await this.outbox.findById(outboxId);
              const decision = planExtractionAttemptFailure({
                failure,
                outboxAttempts: after?.attempts ?? 1,
                maxAttempts: after?.maxAttempts ?? 1,
                deadlineMaxRetries: extractionDeadlineMaxRetries(),
              });
              const nextStatus = await this.outbox.markFailedOrRetry(
                outboxId,
                failure.message,
                decision.delayMs,
                { allowRetry: decision.allowRetry }
              );
              if (nextStatus === 'pending') {
                this.logger.warn(
                  `Extraction ${documentId} will retry via outbox ${outboxId}: ${failure.message}`
                );
              }
              throw new UnrecoverableError(failure.message);
            } else if (plan.kind === 'fail_document') {
              await this.documents.updateStatus(documentId, 'failed', {
                failureReason: plan.failureReason,
              });
            }
            if (plan.kind !== 'retry') {
              throw new UnrecoverableError(failure.message);
            }
            throw failure;
          }
          await this.connection.del(orphanRequeueKey(documentId));
          if (userId) {
            await this.maybeEnqueueArenaSample(documentId, userId);
          }
        });
      },
      {
        connection: this.connection,
        concurrency: documentExtractionConcurrency(this.extractCapacity.recommendedSlots()),
        lockDuration: extractionQueueLockDurationMs(),
        stalledInterval: extractionQueueStalledIntervalMs(),
        maxStalledCount: extractionQueueMaxStalledCount(),
      }
    );
    this.worker.on('failed', (job, error) => {
      if (!job) {
        return;
      }
      void this.persistFinalJobFailure(job, error).catch((persistError: unknown) => {
        const detail = persistError instanceof Error ? persistError.message : String(persistError);
        this.logger.warn(`Could not persist final extraction failure: ${detail}`);
      });
    });
    this.extractCapacity.onSlotsChanged((slots) => {
      this.worker.concurrency = documentExtractionConcurrency(slots);
    });
    this.ready = true;
  }

  private async resolveOutboxId(
    payload: ExtractionOutboxJobPayload | null,
    documentId: string
  ): Promise<string | null> {
    if (payload?.outboxId) {
      return payload.outboxId;
    }
    const active = await this.outbox.findActiveByDocumentId(documentId);
    return active?.id ?? null;
  }

  isReady(): boolean {
    return this.ready;
  }

  async inspectExtractionJob(documentId: string): Promise<ExtractionReconcileJob> {
    if (!this.isReady()) {
      return { live: false, startedAtMs: null };
    }
    const job = await this.queue.getJob(extractionJobId(documentId));
    let live = false;
    let startedAtMs: number | null = null;
    if (job) {
      const state = await job.getState();
      live = isLiveExtractionJobState(state);
      if (
        typeof job.processedOn === 'number' &&
        Number.isFinite(job.processedOn) &&
        job.processedOn > 0
      ) {
        startedAtMs = job.processedOn;
      }
    }
    if (startedAtMs === null) {
      const raw = await this.connection.get(extractionStartedRedisKey(documentId));
      if (raw) {
        const parsed = Number.parseInt(raw, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          startedAtMs = parsed;
        }
      }
    }
    return { live, startedAtMs };
  }

  async recordExtractionStart(documentId: string): Promise<void> {
    if (!this.isReady()) {
      return;
    }
    await this.connection.set(
      extractionStartedRedisKey(documentId),
      String(Date.now()),
      'EX',
      EXTRACT_STARTED_TTL_SECONDS
    );
  }

  async ensureQueued(documentId: string, userId: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('document-extraction queue is not ready');
    }
    const scheduled = await this.outbox.scheduleDocumentExtraction(documentId, userId);
    await this.enqueueFromOutbox({
      outboxId: scheduled.outboxId,
      documentId,
      userId,
    });
    await this.outbox.markEnqueued(scheduled.outboxId);
  }

  async isJobQueuedOrActive(documentId: string): Promise<boolean> {
    const jobId = extractionJobId(documentId);
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return false;
    }
    const state = await job.getState();
    return isBullJobQueuedState(state);
  }

  async recordOrphanRequeue(documentId: string): Promise<number> {
    const key = orphanRequeueKey(documentId);
    const count = await this.connection.incr(key);
    await this.connection.expire(key, ORPHAN_REQUEUE_COUNTER_TTL_SECONDS);
    return count;
  }

  private async persistFinalJobFailure(job: Job, error: Error): Promise<void> {
    const documentId = parseExtractionJobDocumentId(job.data);
    const payload = readOutboxPayload(job.data);
    if (payload?.outboxId) {
      const row = await this.outbox.findById(payload.outboxId);
      if (!shouldPersistTerminalExtractionFailure(row?.status ?? null)) {
        return;
      }
    }
    const state = await job.getState();
    const document = await this.documents.findById(documentId);
    const failureReason = planExtractionJobFailed({
      jobName: job.name,
      jobFinallyFailed: state === 'failed',
      documentStatus: document?.status ?? null,
      error,
    });
    if (failureReason === null) {
      return;
    }
    this.logger.warn(`Extraction job for ${documentId} finally failed: ${error.message}`);
    await this.documents.updateStatus(documentId, 'failed', { failureReason });
  }

  /**
   * Schedules durability in Postgres then pushes to Valkey.
   * Prefer QueueExtractionUseCase for the HTTP path (same-txn schedule + relay).
   */
  async enqueue(documentId: string, userId: string): Promise<void> {
    const scheduled = await this.outbox.scheduleDocumentExtraction(documentId, userId);
    await this.enqueueFromOutbox({
      outboxId: scheduled.outboxId,
      documentId,
      userId,
    });
    await this.outbox.markEnqueued(scheduled.outboxId);
  }

  /** Push one claimed/scheduled outbox row into BullMQ (idempotent on document job id). */
  async enqueueFromOutbox(payload: ExtractionOutboxJobPayload): Promise<void> {
    if (!this.isReady()) {
      throw new Error('document-extraction queue is not ready');
    }
    const jobId = extractionJobId(payload.documentId);
    const prep = await prepareBullFixedJobIdForAdd(this.queue, jobId);
    if (prep === 'add') {
      await enqueueBullJobWithRetry(
        () =>
          this.queue.add(
            'extract',
            {
              documentId: payload.documentId,
              userId: payload.userId,
              outboxId: payload.outboxId,
            },
            {
              jobId,
              // Outbox owns retries; BullMQ runs each attempt once.
              attempts: 1,
              removeOnComplete: 1_000,
              removeOnFail: 500,
            }
          ),
        { maxAttempts: 5, label: QUEUE_NAME }
      );
    }
    await assertBullFixedJobIdQueued(this.queue, jobId);
    this.logger.debug(
      `Enqueued extraction for document ${payload.documentId} (outbox ${payload.outboxId})`
    );
  }

  async maybeEnqueueArenaSample(documentId: string, tenantId: string): Promise<void> {
    const flags = await this.resolveFeatureFlags.execute(tenantId);
    if (!flags.experimentalResearchModels) {
      return;
    }
    const rate = arenaSampleRate();
    if (rate <= 0) {
      return;
    }
    const counter = await this.connection.incr(ARENA_COUNTER_KEY);
    if (counter % rate !== 0) {
      return;
    }
    await this.queue.add(
      'arena-sample',
      { documentId },
      { removeOnComplete: 100, removeOnFail: 50 }
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.ready = false;
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
