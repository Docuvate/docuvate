import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import {
  RunDocumentChatGenerationUseCase,
  type DocumentChatGenerationJobPayload,
} from '../application/run-document-chat-generation.use-case.js';

const QUEUE_NAME = 'document-chat-generation';

@Injectable()
export class DocumentChatGenerationQueueService implements OnModuleInit, OnModuleDestroy {
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;

  constructor(private readonly runGeneration: RunDocumentChatGenerationUseCase) {}

  onModuleInit(): void {
    const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
    this.connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });

    const concurrency = documentChatGenerationConcurrency();

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        await this.runGeneration.execute(job.data as DocumentChatGenerationJobPayload);
      },
      { connection: this.connection, concurrency }
    );
  }

  async enqueue(payload: DocumentChatGenerationJobPayload): Promise<void> {
    const existing = await this.queue.getJob(payload.messageId);
    if (existing) {
      await existing.remove();
    }
    await this.queue.add('generate', payload, {
      jobId: payload.messageId,
      removeOnComplete: 200,
      removeOnFail: 100,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}

function documentChatGenerationConcurrency(): number {
  const raw = process.env['DOCUMENT_CHAT_GENERATION_CONCURRENCY'];
  if (!raw) {
    return 2;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}
