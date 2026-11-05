// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import {
  JOB_OUTBOX_REPOSITORY,
  type JobOutboxRepository,
} from '../../../shared/domain/ports.js';
import {
  type ExtractionOutboxJobPayload,
  ExtractionQueueService,
} from '../../extraction/infrastructure/extraction-queue.service.js';

const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_LEASE_MS = 15 * 60 * 1_000;
const DEFAULT_BATCH = 50;

export interface ExtractionOutboxEnqueuer {
  enqueueFromOutbox(payload: ExtractionOutboxJobPayload): Promise<void>;
  isReady(): boolean;
}

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

  onModuleDestroy(): void {
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
    if (!this.extractionQueue.isReady()) {
      return 0;
    }
    this.running = true;
    try {
      const leaseOlderThan = new Date(Date.now() - this.leaseMs);
      const due = await this.outbox.claimForRelay(this.batchSize, leaseOlderThan);
      let enqueued = 0;
      for (const job of due) {
        try {
          await this.extractionQueue.enqueueFromOutbox({
            outboxId: job.id,
            documentId: job.documentId,
            userId: job.userId,
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
