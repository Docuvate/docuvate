// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatResponse } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  USER_PREFERENCES_REPOSITORY,
  type DocumentChatMessageEntity,
  type DocumentChatThreadRepository,
  type DocumentRepository,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { assertChatEnabled } from '../../settings/application/assert-chat-enabled.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';
import { DocumentChatGenerationQueueService } from '../infrastructure/document-chat-generation-queue.service.js';
import { chatThreadTitleFromMessage } from './chat-thread-title.js';

export interface SendDocumentChatThreadMessageResult extends DocumentChatResponse {
  userMessage: DocumentChatMessageEntity;
  assistantMessage: DocumentChatMessageEntity;
  asyncGeneration: boolean;
}

@Injectable()
export class SendDocumentChatThreadMessageUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly documentAuthz: DocumentAuthorizationService,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase,
    private readonly generationQueue: DocumentChatGenerationQueueService
  ) {}

  async execute(
    documentId: string,
    threadId: string,
    userId: string,
    subject: AuthorizationSubject,
    message: string
  ): Promise<SendDocumentChatThreadMessageResult> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new ValidationError('Nachricht darf nicht leer sein.');
    }

    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:chat', doc);

    await this.threads.assertThreadLinkedToDocument(threadId, documentId, userId);

    const preferences = await this.prefs.getForUser(userId);
    const { customerEffective: providerId } =
      await this.effectiveChatProvider.resolveFromPreference(preferences.preferredChatProvider, {
        persistForUserId: userId,
      });
    assertChatEnabled(providerId);

    const userMessage = await this.threads.appendMessage(threadId, 'user', trimmed);
    await this.threads.updateTitleIfDefault(threadId, chatThreadTitleFromMessage(trimmed));

    const assistantMessage = await this.threads.appendMessage(threadId, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    await this.threads.touchThread(threadId);

    await this.generationQueue.enqueue({
      messageId: assistantMessage.id,
      threadId,
      documentId,
      userId,
      userMessage: trimmed,
    });

    return {
      configured: true,
      provider: providerId,
      setupHint: null,
      reply: { role: 'assistant', content: '' },
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        generationStatus: 'pending',
      },
      asyncGeneration: true,
    };
  }
}
