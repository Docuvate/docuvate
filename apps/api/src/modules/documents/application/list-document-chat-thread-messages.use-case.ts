// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { DocumentChatMessageEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentChatThreadRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import { PgChatMessageCitationsRepository } from '../../cited-chat/infrastructure/pg-chat-message-citations.repository.js';

@Injectable()
export class ListDocumentChatThreadMessagesUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    private readonly documentAuthz: DocumentAuthorizationService,
    private readonly citationsRepo: PgChatMessageCitationsRepository
  ) {}

  async execute(
    documentId: string,
    threadId: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentChatMessageEntity[]> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:chat', doc);
    await this.threads.assertThreadLinkedToDocument(threadId, documentId, userId);
    return this.attachCitations(await this.threads.listMessages(threadId, userId));
  }

  async executeLibrary(threadId: string, userId: string): Promise<DocumentChatMessageEntity[]> {
    const thread = await this.threads.findThreadForUser(threadId, userId);
    if (!thread || thread.scope !== 'library') {
      throw new NotFoundError('Chat thread');
    }
    return this.attachCitations(await this.threads.listMessages(threadId, userId));
  }

  private async attachCitations(
    messages: DocumentChatMessageEntity[]
  ): Promise<DocumentChatMessageEntity[]> {
    const assistantIds = messages
      .filter((m) => m.role === 'assistant' && m.generationStatus === 'done')
      .map((m) => m.id);
    if (assistantIds.length === 0) {
      return messages;
    }
    const citationsByMessage = await this.citationsRepo.listForMessages(assistantIds);
    const allCitations = [...citationsByMessage.values()].flat();
    const withBlocks = await this.citationsRepo.loadHighlightBlocksForCitations(allCitations);
    let highlightIndex = 0;
    return messages.map((message) => {
      if (message.role !== 'assistant' || message.generationStatus !== 'done') {
        return message;
      }
      const stored = citationsByMessage.get(message.id) ?? [];
      const citations = stored.map((c) => {
        const highlighted = withBlocks[highlightIndex];
        highlightIndex += 1;
        return highlighted ? { ...c, blocks: highlighted.blocks } : c;
      });
      return { ...message, citations };
    });
  }
}
