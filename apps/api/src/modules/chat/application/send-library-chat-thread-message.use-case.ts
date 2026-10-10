// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatResponse } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { DocumentChatMessageEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { chatThreadTitleFromMessage } from '../../documents/application/chat-thread-title.js';
import { DocumentChatGenerationQueueService } from '../../documents/infrastructure/document-chat-generation-queue.service.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';

export interface SendLibraryChatThreadMessageResult extends DocumentChatResponse {
  userMessage: DocumentChatMessageEntity;
  assistantMessage: DocumentChatMessageEntity;
  asyncGeneration: boolean;
}

@Injectable()
export class SendLibraryChatThreadMessageUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase,
    private readonly generationQueue: DocumentChatGenerationQueueService
  ) {}

  async execute(
    threadId: string,
    userId: string,
    message: string
  ): Promise<SendLibraryChatThreadMessageResult> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new ValidationError('Nachricht darf nicht leer sein.');
    }

    const thread = await this.threads.findThreadForUser(threadId, userId);
    if (thread?.scope !== 'library') {
      throw new NotFoundError('Chat thread');
    }

    const preferences = await this.prefs.getForUser(userId);
    const { customerEffective: providerId } =
      await this.effectiveChatProvider.resolveFromPreference(preferences.preferredChatProvider, {
        persistForUserId: userId,
      });

    const userMessage = await this.threads.appendMessage(threadId, 'user', trimmed);
    await this.threads.updateTitleIfDefault(threadId, chatThreadTitleFromMessage(trimmed));

    const assistantMessage = await this.threads.appendMessage(threadId, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    await this.threads.touchThread(threadId);

    if (providerId !== 'off') {
      await this.generationQueue.enqueue({
        messageId: assistantMessage.id,
        threadId,
        userId,
        userMessage: trimmed,
      });
    } else {
      await this.threads.updateMessageGeneration(assistantMessage.id, {
        generationStatus: 'failed',
        generationPhase: null,
        errorCode: 'provider_unavailable',
        errorDetail: 'Chat provider off',
        content: '',
      });
    }

    const configured = providerId !== 'off';

    return {
      configured,
      provider: providerId,
      setupHint: configured
        ? null
        : 'Dokument-Chat benötigt Ollama (kleines Modell) und Worker für RAG.',
      reply: { role: 'assistant', content: '' },
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        generationStatus: providerId === 'off' ? 'failed' : 'pending',
      },
      asyncGeneration: configured,
    };
  }
}
