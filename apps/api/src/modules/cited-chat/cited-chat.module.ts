// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { ChatInfrastructureModule } from '../chat-infrastructure/chat-infrastructure.module.js';
import { SearchModule } from '../search/search.module.js';
import { CitedChatGenerationService } from './application/cited-chat-generation.service.js';

@Module({
  imports: [SearchModule, ChatInfrastructureModule],
  providers: [CitedChatGenerationService],
  exports: [CitedChatGenerationService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class CitedChatModule {}
