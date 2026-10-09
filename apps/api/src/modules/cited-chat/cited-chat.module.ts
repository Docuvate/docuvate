import { Module, forwardRef } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import { SearchModule } from '../search/search.module.js';
import { CitedChatGenerationService } from './application/cited-chat-generation.service.js';
import { PgCitedChatRetrievalRepository } from './infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgChatMessageCitationsRepository } from './infrastructure/pg-chat-message-citations.repository.js';

@Module({
  imports: [SearchModule, forwardRef(() => DocumentsModule)],
  providers: [
    PgCitedChatRetrievalRepository,
    PgChatMessageCitationsRepository,
    CitedChatGenerationService,
  ],
  exports: [
    PgCitedChatRetrievalRepository,
    PgChatMessageCitationsRepository,
    CitedChatGenerationService,
  ],
})
export class CitedChatModule {}
