// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { ChatInfrastructureModule } from '../chat-infrastructure/chat-infrastructure.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { CreateLibraryChatThreadUseCase } from './application/create-library-chat-thread.use-case.js';
import { ListLibraryChatThreadsUseCase } from './application/list-library-chat-threads.use-case.js';
import { SendLibraryChatThreadMessageUseCase } from './application/send-library-chat-thread-message.use-case.js';
import { ChatController } from './presentation/chat.controller.js';

@Module({
  imports: [DocumentsModule, SettingsModule, ChatInfrastructureModule],
  controllers: [ChatController],
  providers: [
    CreateLibraryChatThreadUseCase,
    ListLibraryChatThreadsUseCase,
    SendLibraryChatThreadMessageUseCase,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ChatModule {}
