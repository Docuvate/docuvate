import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { RunExtractionUseCase } from '../../documents/application/run-extraction.use-case.js';
import { RunArenaSampleCompareUseCase } from '../../documents/application/run-arena-sample-compare.use-case.js';
import { arenaSampleRate } from '../../../shared/infrastructure/arena/arena-sample-config.js';

const QUEUE_NAME = 'document-extraction';
const ARENA_COUNTER_KEY = 'arena:sample:counter';

@Injectable()
export class ExtractionQueueService implements OnModuleInit, OnModuleDestroy {
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly runExtraction: RunExtractionUseCase,
    private readonly runArenaSample: RunArenaSampleCompareUseCase
  ) {}

  onModuleInit(): void {
    const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
    this.connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });

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
    await this.queue.add('extract', { documentId, userId: _userId });
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
