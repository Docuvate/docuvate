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
export class ChatModule {}
