import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import {
  JOB_OUTBOX_REPOSITORY,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import { arenaSampleRate } from '../../../shared/infrastructure/arena/arena-sample-config.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import { computeRetryDelayMs } from '../../job-outbox/domain/job-outbox.types.js';
import { RunArenaSampleCompareUseCase } from '../../documents/application/run-arena-sample-compare.use-case.js';
import { RunExtractionUseCase } from '../../documents/application/run-extraction.use-case.js';

const QUEUE_NAME = 'document-extraction';
const ARENA_COUNTER_KEY = 'arena:sample:counter';

export type ExtractionOutboxJobPayload = {
  outboxId: string;
  documentId: string;
};

function readJobName(name: string | undefined): 'extract' | 'arena-sample' | 'unknown' {
  if (name === 'extract' || name === 'arena-sample') {
    return name;
  }
  return 'unknown';
}

function readOutboxPayload(data: unknown): ExtractionOutboxJobPayload | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  if (!('outboxId' in data) || !('documentId' in data)) {
    return null;
  }
  const outboxIdValue: unknown = Reflect.get(data, 'outboxId');
  const documentIdValue: unknown = Reflect.get(data, 'documentId');
  if (typeof outboxIdValue !== 'string' || typeof documentIdValue !== 'string') {
    return null;
  }
  if (outboxIdValue.length === 0 || documentIdValue.length === 0) {
    return null;
  }
  return { outboxId: outboxIdValue, documentId: documentIdValue };
}

function readDocumentId(data: unknown): string | null {
  const payload = readOutboxPayload(data);
  if (payload) {
    return payload.documentId;
  }
  if (typeof data !== 'object' || data === null || !('documentId' in data)) {
    return null;
  }
  const value: unknown = Reflect.get(data, 'documentId');
  return typeof value === 'string' && value.length > 0 ? value : null;
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
    @Inject(JOB_OUTBOX_REPOSITORY) private readonly outbox: JobOutboxRepository
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const jobName = readJobName(job.name);
        if (jobName === 'arena-sample') {
          const documentId = readDocumentId(job.data);
          if (!documentId) {
            throw new Error('arena-sample job missing documentId');
          }
          await this.runArenaSample.execute(documentId);
          return;
        }

        const payload = readOutboxPayload(job.data);
        if (!payload) {
          throw new Error('extract job missing outbox payload');
        }

        const existing = await this.outbox.findById(payload.outboxId);
        if (existing?.status === 'done' || existing?.status === 'failed') {
          this.logger.debug(`Skipping terminal outbox ${payload.outboxId} (${existing.status})`);
          return;
        }

        const started = await this.outbox.markRunning(payload.outboxId);
        if (!started) {
          const again = await this.outbox.findById(payload.outboxId);
          if (again?.status === 'done' || again?.status === 'failed' || again?.status === 'running') {
            return;
          }
          throw new Error(`Unable to mark outbox ${payload.outboxId} running (status=${again?.status ?? 'missing'})`);
        }

        try {
          await this.runExtraction.execute(payload.documentId);
          await this.outbox.markDone(payload.outboxId);
          await this.maybeEnqueueArenaSample(payload.documentId);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          const after = await this.outbox.findById(payload.outboxId);
          const attempts = after?.attempts ?? 1;
          const delayMs = computeRetryDelayMs(attempts);
          const nextStatus = await this.outbox.markFailedOrRetry(
            payload.outboxId,
            message,
            delayMs
          );
          if (nextStatus === 'failed') {
            throw error;
          }
          this.logger.warn(
            `Extraction ${payload.documentId} will retry (outbox ${payload.outboxId}): ${message}`
          );
        }
      },
      { connection: this.connection }
    );
    this.ready = true;
  }

  /** @deprecated Prefer outbox scheduling + relay. Kept for direct test doubles. */
  async enqueue(documentId: string, _userId: string): Promise<void> {
    await this.enqueueFromOutbox({
      outboxId: `legacy:${documentId}`,
      documentId,
    });
  }

  async enqueueFromOutbox(payload: ExtractionOutboxJobPayload): Promise<void> {
    if (!this.ready || !this.queue) {
      throw new Error('Extraction queue is not ready');
    }
    const alreadyQueued = await this.hasActiveBullJob(payload.outboxId);
    if (alreadyQueued) {
      this.logger.debug(
        `BullMQ already holds outbox ${payload.outboxId}; skipping duplicate add`
      );
      return;
    }
    await enqueueBullJobWithRetry(
      () =>
        this.queue.add('extract', payload, {
          jobId: payload.outboxId,
          attempts: 1,
          removeOnComplete: 1_000,
          removeOnFail: 500,
        }),
      { maxAttempts: 5, label: QUEUE_NAME }
    );
    this.logger.debug(
      `Enqueued extraction for document ${payload.documentId} (outbox ${payload.outboxId})`
    );
  }

  /** Returns true when Valkey already has a live job for this outbox id. */
  private async hasActiveBullJob(outboxId: string): Promise<boolean> {
    const existing = await this.queue.getJob(outboxId);
    if (!existing) {
      return false;
    }
    const state = await existing.getState();
    if (state === 'waiting' || state === 'delayed' || state === 'active' || state === 'prioritized' || state === 'waiting-children') {
      return true;
    }
    await existing.remove();
    return false;
  }

  async maybeEnqueueArenaSample(documentId: string): Promise<void> {
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
      { documentId, outboxId: `arena:${documentId}` },
      { removeOnComplete: 100, removeOnFail: 50 }
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.ready = false;
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}
