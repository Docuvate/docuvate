// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { DOCUMENT_CHAT_THREAD_REPOSITORY } from '../../shared/domain/ports.js';
import { PgChatMessageCitationsRepository } from '../cited-chat/infrastructure/pg-chat-message-citations.repository.js';
import { PgCitedChatRetrievalRepository } from '../cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgDocumentChatThreadRepository } from '../documents/infrastructure/pg-document-chat-thread.repository.js';

@Module({
  providers: [
    PgDocumentChatThreadRepository,
    PgChatMessageCitationsRepository,
    PgCitedChatRetrievalRepository,
    {
      provide: DOCUMENT_CHAT_THREAD_REPOSITORY,
      useExisting: PgDocumentChatThreadRepository,
    },
  ],
  exports: [
    DOCUMENT_CHAT_THREAD_REPOSITORY,
    PgDocumentChatThreadRepository,
    PgChatMessageCitationsRepository,
    PgCitedChatRetrievalRepository,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ChatInfrastructureModule {}
