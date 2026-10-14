// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { ChatInfrastructureModule } from '../chat-infrastructure/chat-infrastructure.module.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';
import { SearchModule } from '../search/search.module.js';
import { ChatLibraryStatsService } from './application/chat-library-stats.service.js';
import { ChatQueryRouterService } from './application/chat-query-router.service.js';
import { CitedChatGenerationService } from './application/cited-chat-generation.service.js';
import { PgChatLibraryStatsRepository } from './infrastructure/pg-chat-library-stats.repository.js';

@Module({
  imports: [SearchModule, ChatInfrastructureModule, FeatureFlagsModule],
  providers: [
    PgChatLibraryStatsRepository,
    ChatLibraryStatsService,
    ChatQueryRouterService,
    CitedChatGenerationService,
  ],
  exports: [CitedChatGenerationService, ChatQueryRouterService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class CitedChatModule {}
