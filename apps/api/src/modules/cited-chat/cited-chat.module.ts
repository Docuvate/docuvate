// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { ChatInfrastructureModule } from '../chat-infrastructure/chat-infrastructure.module.js';
import { SearchModule } from '../search/search.module.js';
import { CitedChatGenerationService } from './application/cited-chat-generation.service.js';
import { PgCitedChatRetrievalRepository } from './infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgChatMessageCitationsRepository } from './infrastructure/pg-chat-message-citations.repository.js';

@Module({
  imports: [SearchModule, ChatInfrastructureModule],
  providers: [CitedChatGenerationService],
  exports: [CitedChatGenerationService],
})
export class CitedChatModule {}
