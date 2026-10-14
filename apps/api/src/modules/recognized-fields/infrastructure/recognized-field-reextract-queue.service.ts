// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';

import { parseStringArray, parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import { ApplyGlobalRecognizedFieldsUseCase } from '../application/apply-global-recognized-fields.use-case.js';
import { RECOGNIZED_FIELD_REEXTRACT_QUEUE_NAME } from '../domain/recognized-field-reextract-config.js';

interface RecognizedFieldReextractJobData {
  userId: string;
  documentId: string;
  fieldDefinitionIds: string[];
}

function parseJobData(data: unknown): RecognizedFieldReextractJobData {
  const row = requireRecord(data);
  return {
    userId: parseString(row.userId).trim(),
    documentId: parseString(row.documentId).trim(),
    fieldDefinitionIds: parseStringArray(row.fieldDefinitionIds),
  };
}

@Injectable()
export class RecognizedFieldReextractQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecognizedFieldReextractQueueService.name);
  private connection!: IORedis;
  private queue!: Queue<RecognizedFieldReextractJobData>;
  private worker!: Worker<RecognizedFieldReextractJobData>;

  constructor(private readonly applyGlobalFields: ApplyGlobalRecognizedFieldsUseCase) {}

  async onModuleInit(): Promise<void> {
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);

    this.queue = new Queue<RecognizedFieldReextractJobData>(RECOGNIZED_FIELD_REEXTRACT_QUEUE_NAME, {
      connection: this.connection,
    });

    this.worker = new Worker<RecognizedFieldReextractJobData>(
      RECOGNIZED_FIELD_REEXTRACT_QUEUE_NAME,
      async (job) => {
        const { userId, documentId, fieldDefinitionIds } = parseJobData(job.data);
        await this.applyGlobalFields.execute(documentId, userId, {
          scopeDefinitionIds: fieldDefinitionIds.length > 0 ? fieldDefinitionIds : undefined,
        });
      },
      { connection: this.connection, concurrency: 2 }
    );
  }

  async enqueue(
    userId: string,
    documentId: string,
    fieldDefinitionIds: readonly string[]
  ): Promise<void> {
    const jobId = `recognized-field-reextract-${userId}-${documentId}-${fieldDefinitionIds.slice().sort().join(',')}`;
    await enqueueBullJobWithRetry(
      () =>
        this.queue.add(
          'reextract',
          {
            userId,
            documentId,
            fieldDefinitionIds: [...fieldDefinitionIds],
          },
          {
            jobId,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2_000 },
            removeOnComplete: 1_000,
            removeOnFail: 500,
          }
        ),
      { maxAttempts: 5, label: RECOGNIZED_FIELD_REEXTRACT_QUEUE_NAME }
    );
    this.logger.debug(`Enqueued recognized-field reextract for document ${documentId}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
