// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';

import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import {
  isRecord,
  parseOptionalString,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';
import {
  type DocumentChatGenerationJobPayload,
  RunDocumentChatGenerationUseCase,
} from '../application/run-document-chat-generation.use-case.js';

const QUEUE_NAME = 'document-chat-generation';

function parseJobPayload(data: unknown): DocumentChatGenerationJobPayload | null {
  if (!isRecord(data)) {
    return null;
  }
  const messageId = parseString(data.messageId);
  const threadId = parseString(data.threadId);
  const userId = parseString(data.userId);
  const userMessage = parseString(data.userMessage);
  if (!messageId || !threadId || !userId) {
    return null;
  }
  const documentId = parseOptionalString(data.documentId) ?? undefined;
  return { messageId, threadId, userId, userMessage, documentId };
}

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
        const payload = parseJobPayload(job.data);
        if (!payload) {
          throw new Error('Invalid document chat generation job payload');
        }
        await this.runGeneration.execute(payload);
      },
      { connection: this.connection, concurrency }
    );

    this.worker.on('failed', (job, err) => {
      const payload = job ? parseJobPayload(job.data) : null;
      void this.markJobFailed(payload, err);
    });
  }

  private async markJobFailed(
    payload: DocumentChatGenerationJobPayload | null,
    err: Error
  ): Promise<void> {
    if (!payload?.messageId || !payload.userId) {
      return;
    }
    try {
      const existing = await this.threads.findMessageForUser(payload.messageId, payload.userId);
      if (
        !existing ||
        existing.generationStatus === 'done' ||
        existing.generationStatus === 'failed'
      ) {
        return;
      }
      await this.threads.updateMessageGeneration(payload.messageId, {
        generationStatus: 'failed',
        generationPhase: null,
        errorCode: 'generation_failed',
        errorDetail: err.message,
        content: existing.content,
      });
      if (payload.threadId) {
        await this.threads.touchThread(payload.threadId);
      }
    } catch (markErr) {
      this.logger.warn(`Could not mark chat generation failed: ${String(markErr)}`);
    }
  }

  async isJobQueuedOrActive(messageId: string): Promise<boolean> {
    const job = await this.queue.getJob(messageId);
    if (!job) {
      return false;
    }
    const state = await job.getState();
    return state === 'active' || state === 'waiting' || state === 'delayed';
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
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
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
