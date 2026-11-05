import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  JOB_OUTBOX_REPOSITORY,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import {
  ExtractionQueueService,
  type ExtractionOutboxJobPayload,
} from '../../extraction/infrastructure/extraction-queue.service.js';
import { JOB_TYPE_DOCUMENT_EXTRACTION } from '../domain/job-outbox.types.js';

const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_LEASE_MS = 15 * 60 * 1_000;
const DEFAULT_BATCH = 50;

export type ExtractionOutboxEnqueuer = {
  enqueueFromOutbox(payload: ExtractionOutboxJobPayload): Promise<void>;
};

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private readonly intervalMs: number;
  private readonly leaseMs: number;
  private readonly batchSize: number;

  constructor(
    @Inject(JOB_OUTBOX_REPOSITORY) private readonly outbox: JobOutboxRepository,
    @Inject(ExtractionQueueService) private readonly extractionQueue: ExtractionOutboxEnqueuer
  ) {
    this.intervalMs = readPositiveInt(process.env['JOB_OUTBOX_RELAY_INTERVAL_MS'], DEFAULT_INTERVAL_MS);
    this.leaseMs = readPositiveInt(process.env['JOB_OUTBOX_LEASE_MS'], DEFAULT_LEASE_MS);
    this.batchSize = readPositiveInt(process.env['JOB_OUTBOX_RELAY_BATCH'], DEFAULT_BATCH);
  }

  async onModuleInit(): Promise<void> {
    await this.relayOnce();
    this.timer = setInterval(() => {
      void this.relayOnce();
    }, this.intervalMs);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Public for tests and startup; safe to call concurrently (single-flight). */
  async relayOnce(): Promise<number> {
    if (this.running) {
      return 0;
    }
    this.running = true;
    try {
      const leaseOlderThan = new Date(Date.now() - this.leaseMs);
      const due = await this.outbox.claimForRelay(this.batchSize, leaseOlderThan);
      let enqueued = 0;
      for (const job of due) {
        if (job.jobType !== JOB_TYPE_DOCUMENT_EXTRACTION) {
          this.logger.warn(`Skipping unsupported job type ${job.jobType} (${job.id})`);
          continue;
        }
        try {
          await this.extractionQueue.enqueueFromOutbox({
            outboxId: job.id,
            documentId: job.documentId,
          });
          const ok = await this.outbox.markEnqueued(job.id);
          if (ok) {
            enqueued += 1;
          }
        } catch (error: unknown) {
          const detail = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Outbox relay enqueue failed for ${job.id}: ${detail}`);
        }
      }
      return enqueued;
    } finally {
      this.running = false;
    }
  }
}
