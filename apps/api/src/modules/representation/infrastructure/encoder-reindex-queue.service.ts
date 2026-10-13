// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { ReindexStaleRepresentationUseCase } from '../application/reindex-stale-representation.use-case.js';
import {
  ENCODER_REINDEX_BATCH_SIZE,
  ENCODER_REINDEX_QUEUE_NAME,
  ENCODER_REINDEX_SCAN_MS,
} from '../domain/encoder-reindex-config.js';
import { PgEncoderReindexRepository } from './pg-encoder-reindex.repository.js';

interface EncoderReindexJobData {
  tenantId: string;
  documentId: string;
}

@Injectable()
export class EncoderReindexQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EncoderReindexQueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue<EncoderReindexJobData> | null = null;
  private worker: Worker<EncoderReindexJobData> | null = null;
  private scanTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly reindex: ReindexStaleRepresentationUseCase,
    private readonly repository: PgEncoderReindexRepository
  ) {}

  onModuleInit(): void {
    const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
    this.connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue<EncoderReindexJobData>(ENCODER_REINDEX_QUEUE_NAME, {
      connection: this.connection,
    });
    this.worker = new Worker<EncoderReindexJobData>(
      ENCODER_REINDEX_QUEUE_NAME,
      async (job) => {
        const tenantId = parseString(requireRecord(job.data).tenantId);
        const documentId = parseString(requireRecord(job.data).documentId);
        await this.reindex.execute(tenantId, documentId);
      },
      { connection: this.connection, concurrency: 1 }
    );

    this.scanTimer = setInterval(() => {
      void this.scanAndEnqueue();
    }, ENCODER_REINDEX_SCAN_MS);
    void this.scanAndEnqueue();
  }

  private async scanAndEnqueue(): Promise<void> {
    if (!this.queue) {
      return;
    }
    try {
      const tenantIds = await this.repository.listTenantIdsWithStaleRepresentations(32);
      for (const tenantId of tenantIds) {
        const documentIds = await this.repository.listStaleDocumentIdsForTenant(
          tenantId,
          ENCODER_REINDEX_BATCH_SIZE
        );
        for (const documentId of documentIds) {
          const jobId = `encoder-reindex-${tenantId}-${documentId}`;
          const existing = await this.queue.getJob(jobId);
          if (existing) {
            continue;
          }
          await this.queue.add(
            'reindex',
            { tenantId, documentId },
            {
              jobId,
              removeOnComplete: 500,
              removeOnFail: 200,
              attempts: 2,
              backoff: { type: 'exponential', delay: 5_000 },
            }
          );
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Encoder reindex scan skipped: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
    }
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
  }
}
