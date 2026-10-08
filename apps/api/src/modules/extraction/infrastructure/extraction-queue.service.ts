import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { RunExtractionUseCase } from '../../documents/application/run-extraction.use-case.js';
import { RunArenaSampleCompareUseCase } from '../../documents/application/run-arena-sample-compare.use-case.js';
import { arenaSampleRate } from '../../../shared/infrastructure/arena/arena-sample-config.js';
import { enqueueBullJobWithRetry } from '../../../shared/infrastructure/queue/bullmq-enqueue-retry.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';

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
    private readonly runArenaSample: RunArenaSampleCompareUseCase
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const documentId = job.data.documentId as string;
        if (job.name === 'arena-sample') {
          await this.runArenaSample.execute(documentId);
          return;
        }
        await this.runExtraction.execute(documentId);
        await this.maybeEnqueueArenaSample(documentId);
      },
      { connection: this.connection }
    );
  }

  async enqueue(documentId: string, _userId: string): Promise<void> {
    await enqueueBullJobWithRetry(
      () =>
        this.queue.add(
          'extract',
          { documentId, userId: _userId },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2_000 },
            removeOnComplete: 1_000,
            removeOnFail: 500,
          }
        ),
      { maxAttempts: 5, label: QUEUE_NAME }
    );
    this.logger.debug(`Enqueued extraction for document ${documentId}`);
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
      { documentId },
      { removeOnComplete: 100, removeOnFail: 50 }
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}
