// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';

import { parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import { ApplyFuzzyDuplicateDetectionUseCase } from '../application/apply-fuzzy-duplicate-detection.use-case.js';
import {
  DUPLICATE_DETECTION_QUEUE_NAME,
  duplicateDetectionJobId,
  duplicateDetectionQueueConcurrency,
} from '../domain/duplicate-detection-queue.config.js';

export interface DuplicateDetectionJobData {
  documentId: string;
  userId: string;
}

function parseJobData(data: unknown): DuplicateDetectionJobData {
  const row = requireRecord(data);
  return {
    documentId: parseString(row.documentId).trim(),
    userId: parseString(row.userId).trim(),
  };
}

@Injectable()
export class DuplicateDetectionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DuplicateDetectionQueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue<DuplicateDetectionJobData> | null = null;
  private worker: Worker<DuplicateDetectionJobData> | null = null;

  constructor(private readonly applyFuzzyDuplicateDetection: ApplyFuzzyDuplicateDetectionUseCase) {}

  async onModuleInit(): Promise<void> {
    const connection = createValkeyConnection();
    await waitForValkeyReady(connection);
    this.connection = connection;

    const queue = new Queue<DuplicateDetectionJobData>(DUPLICATE_DETECTION_QUEUE_NAME, {
      connection,
    });
    this.queue = queue;

    const worker = new Worker<DuplicateDetectionJobData>(
      DUPLICATE_DETECTION_QUEUE_NAME,
      async (job) => {
        const { documentId, userId } = parseJobData(job.data);
        await this.applyFuzzyDuplicateDetection.execute(documentId, userId);
      },
      {
        connection,
        concurrency: duplicateDetectionQueueConcurrency(),
      }
    );
    this.worker = worker;

    worker.on('failed', (job, error) => {
      const id = job?.data != null ? parseJobData(job.data).documentId : 'unknown';
      this.logger.warn(`Duplicate detection job failed for ${id}: ${error.message}`);
    });
  }

  async enqueueFuzzy(documentId: string, userId: string): Promise<void> {
    const jobId = duplicateDetectionJobId(documentId);
    const queue = this.queue;
    if (!queue) {
      return;
    }
    await enqueueBullJobWithRetry(
      () =>
        queue.add(
          'fuzzy',
          { documentId, userId },
          {
            jobId,
            priority: 1,
            removeOnComplete: 200,
            removeOnFail: 100,
          }
        ),
      { maxAttempts: 5, label: DUPLICATE_DETECTION_QUEUE_NAME }
    );
  }

  async onModuleDestroy(): Promise<void> {
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
