import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import {
  RunDocumentChatGenerationUseCase,
  type DocumentChatGenerationJobPayload,
} from '../application/run-document-chat-generation.use-case.js';

const QUEUE_NAME = 'document-chat-generation';

@Injectable()
export class DocumentChatGenerationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentChatGenerationQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly runGeneration: RunDocumentChatGenerationUseCase,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);

    const concurrency = documentChatGenerationConcurrency();

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        await this.runGeneration.execute(job.data as DocumentChatGenerationJobPayload);
      },
      { connection: this.connection, concurrency }
    );

    this.worker.on('failed', (job, err) => {
      void this.markJobFailed(job?.data as DocumentChatGenerationJobPayload | undefined, err);
    });
  }

  private async markJobFailed(
    payload: DocumentChatGenerationJobPayload | undefined,
    err: Error
  ): Promise<void> {
    if (!payload?.messageId || !payload.userId) {
      return;
    }
    try {
      const existing = await this.threads.findMessageForUser(payload.messageId, payload.userId);
      if (!existing || existing.generationStatus === 'done' || existing.generationStatus === 'failed') {
        return;
      }
      await this.threads.updateMessageGeneration(payload.messageId, {
        generationStatus: 'failed',
        generationPhase: null,
        errorCode: 'generation_failed',
        errorDetail: err.message,
        content: existing.content ?? '',
      });
      if (payload.threadId) {
        await this.threads.touchThread(payload.threadId);
      }
    } catch (markErr) {
      this.logger.warn(`Could not mark chat generation failed: ${String(markErr)}`);
    }
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
    return 1;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
