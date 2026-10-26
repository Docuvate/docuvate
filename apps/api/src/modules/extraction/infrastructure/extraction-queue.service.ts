// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, UnrecoverableError, Worker } from 'bullmq';
import type IORedis from 'ioredis';

import { arenaSampleRate } from '../../../shared/infrastructure/arena/arena-sample-config.js';
import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import { RunArenaSampleCompareUseCase } from '../../documents/application/run-arena-sample-compare.use-case.js';
import { RunExtractionUseCase } from '../../documents/application/run-extraction.use-case.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import {
  documentExtractionConcurrency,
  extractionJobId,
  extractionQueueLockDurationMs,
  extractionQueueMaxStalledCount,
  extractionQueueStalledIntervalMs,
} from '../domain/extraction-queue.config.js';
import { isPermanentExtractionFailureMessage } from '../domain/extraction-queue-failures.js';

function parseExtractionJobDocumentId(data: unknown): string {
  const row = requireRecord(data);
  const documentId = parseString(row.documentId).trim();
  if (!documentId) {
    throw new Error('document-extraction job missing documentId');
  }
  return documentId;
}

const QUEUE_NAME = 'document-extraction';
const ARENA_COUNTER_KEY = 'arena:sample:counter';

@Injectable()
export class ExtractionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExtractionQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly runExtraction: RunExtractionUseCase,
    private readonly runArenaSample: RunArenaSampleCompareUseCase,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
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
        const userId = parseString(requireRecord(job.data).userId).trim();
        try {
          await this.runExtraction.execute(documentId);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          if (isPermanentExtractionFailureMessage(message)) {
            throw new UnrecoverableError(message);
          }
          throw error;
        }
        await this.maybeEnqueueArenaSample(documentId, userId);
      },
      {
        connection: this.connection,
        concurrency: documentExtractionConcurrency(),
        lockDuration: extractionQueueLockDurationMs(),
        stalledInterval: extractionQueueStalledIntervalMs(),
        maxStalledCount: extractionQueueMaxStalledCount(),
      }
    );
  }

  async enqueue(documentId: string, _userId: string): Promise<void> {
    await enqueueBullJobWithRetry(
      () =>
        this.queue.add(
          'extract',
          { documentId, userId: _userId },
          {
            jobId: extractionJobId(documentId),
            attempts: 5,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: 1_000,
            removeOnFail: 500,
          }
        ),
      { maxAttempts: 5, label: QUEUE_NAME }
    );
    this.logger.debug(`Enqueued extraction for document ${documentId}`);
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
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
