import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import { DocumentChatGenerationCancelRegistry } from '../infrastructure/document-chat-generation-cancel.registry.js';
import { isActiveGenerationStatus } from './document-chat-generation-status.js';

@Injectable()
export class CancelDocumentChatGenerationUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    private readonly cancelRegistry: DocumentChatGenerationCancelRegistry
  ) {}

  async execute(
    documentId: string,
    threadId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    await this.threads.assertThreadLinkedToDocument(threadId, documentId, userId);
    const message = await this.threads.findMessageForUser(messageId, userId);
    if (!message || message.threadId !== threadId) {
      throw new NotFoundError('Chat message');
    }
    if (!isActiveGenerationStatus(message.generationStatus)) {
      throw new ValidationError('Diese Antwort wird nicht mehr erzeugt.');
    }
    await this.cancelRegistry.requestCancel(messageId);
  }
}
