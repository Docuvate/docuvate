import { Module } from '@nestjs/common';
import { DOCUMENT_CHAT_THREAD_REPOSITORY } from '../../shared/domain/ports.js';
import { PgDocumentChatThreadRepository } from '../documents/infrastructure/pg-document-chat-thread.repository.js';
import { PgChatMessageCitationsRepository } from '../cited-chat/infrastructure/pg-chat-message-citations.repository.js';
import { PgCitedChatRetrievalRepository } from '../cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';

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
export class ChatInfrastructureModule {}
