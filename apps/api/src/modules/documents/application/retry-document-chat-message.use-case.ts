// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { DocumentChatMessageEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { DocumentChatGenerationQueueService } from '../infrastructure/document-chat-generation-queue.service.js';

@Injectable()
export class RetryDocumentChatMessageUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    private readonly generationQueue: DocumentChatGenerationQueueService
  ) {}

  async execute(
    documentId: string,
    threadId: string,
    messageId: string,
    userId: string
  ): Promise<DocumentChatMessageEntity> {
    await this.threads.assertThreadLinkedToDocument(threadId, documentId, userId);
    const message = await this.threads.findMessageForUser(messageId, userId);
    if (!message || message.threadId !== threadId || message.role !== 'assistant') {
      throw new NotFoundError('Chat message');
    }
    if (message.generationStatus !== 'failed') {
      throw new ValidationError('Nur fehlgeschlagene Antworten können erneut versucht werden.');
    }

    const allMessages = await this.threads.listMessages(threadId, userId);
    const index = allMessages.findIndex((m) => m.id === messageId);
    const userMessage = index > 0 ? allMessages[index - 1] : null;
    if (!userMessage || userMessage.role !== 'user') {
      throw new ValidationError('Keine zugehörige Nutzerfrage gefunden.');
    }

    const reset = await this.threads.resetMessageForRetry(messageId);
    await this.generationQueue.enqueue({
      messageId,
      threadId,
      documentId,
      userId,
      userMessage: userMessage.content,
    });
    return reset;
  }

  async executeLibrary(
    threadId: string,
    messageId: string,
    userId: string
  ): Promise<DocumentChatMessageEntity> {
    const thread = await this.threads.findThreadForUser(threadId, userId);
    if (!thread || thread.scope !== 'library') {
      throw new NotFoundError('Chat thread');
    }
    const message = await this.threads.findMessageForUser(messageId, userId);
    if (!message || message.threadId !== threadId || message.role !== 'assistant') {
      throw new NotFoundError('Chat message');
    }
    if (message.generationStatus !== 'failed') {
      throw new ValidationError('Nur fehlgeschlagene Antworten können erneut versucht werden.');
    }

    const allMessages = await this.threads.listMessages(threadId, userId);
    const index = allMessages.findIndex((m) => m.id === messageId);
    const userMessage = index > 0 ? allMessages[index - 1] : null;
    if (!userMessage || userMessage.role !== 'user') {
      throw new ValidationError('Keine zugehörige Nutzerfrage gefunden.');
    }

    const reset = await this.threads.resetMessageForRetry(messageId);
    await this.generationQueue.enqueue({
      messageId,
      threadId,
      userId,
      userMessage: userMessage.content,
    });
    return reset;
  }
}
