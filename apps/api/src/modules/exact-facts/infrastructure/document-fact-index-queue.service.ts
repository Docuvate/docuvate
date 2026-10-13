// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import type pg from 'pg';

import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import { RebuildDocumentFactIndexUseCase } from '../application/rebuild-document-fact-index.use-case.js';
import { PgDocumentExtractedFactRepository } from './pg-document-extracted-fact.repository.js';

const QUEUE_NAME = 'document-fact-index';
const BACKFILL_INTERVAL_MS = 120_000;
const BACKFILL_BATCH = 8;

function parseJobPayload(data: unknown): { documentId: string; tenantId: string } {
  const row = isRecord(data) ? data : {};
  const documentId = parseString(row.documentId).trim();
  const tenantId = parseString(row.tenantId).trim();
  if (!documentId || !tenantId) {
    throw new Error('document-fact-index job missing documentId or tenantId');
  }
  return { documentId, tenantId };
}

@Injectable()
export class DocumentFactIndexQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentFactIndexQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly rebuild: RebuildDocumentFactIndexUseCase,
    private readonly resolveFlags: ResolveFeatureFlagsUseCase,
    private readonly factRepository: PgDocumentExtractedFactRepository,
    @Inject(PG_POOL) private readonly pool: pg.Pool
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);
    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { documentId, tenantId } = parseJobPayload(job.data);
        await this.rebuild.execute(documentId, tenantId);
      },
      { connection: this.connection }
    );
    this.intervalId = setInterval(() => {
      void this.scheduleBackfillBatch();
    }, BACKFILL_INTERVAL_MS);
    void this.scheduleBackfillBatch();
  }

  async enqueue(documentId: string, tenantId: string): Promise<void> {
    await enqueueBullJobWithRetry(
      () =>
        this.queue.add(
          'rebuild',
          { documentId, tenantId },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2_000 },
            removeOnComplete: 500,
            removeOnFail: 200,
          }
        ),
      { maxAttempts: 5, label: QUEUE_NAME }
    );
  }

  private async scheduleBackfillBatch(): Promise<void> {
    try {
      const tenants = await this.listTenantIdsWithReadyDocuments();
      for (const tenantId of tenants) {
        const flags = await this.resolveFlags.execute(tenantId);
        if (!flags.exactAnswers) {
          continue;
        }
        const missing = await this.factRepository.listDocumentIdsMissingIndex(
          tenantId,
          BACKFILL_BATCH
        );
        for (const documentId of missing) {
          await this.enqueue(documentId, tenantId);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Fact index backfill scheduling failed: ${message}`);
    }
  }

  private async listTenantIdsWithReadyDocuments(): Promise<string[]> {
    const result = await this.pool.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM documents WHERE status = 'ready' LIMIT 200`
    );
    return result.rows.map((row) => row.user_id);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
