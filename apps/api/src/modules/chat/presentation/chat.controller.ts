import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  AuthGuard,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  CreateDocumentChatThreadRequestDto,
  DocumentChatThreadListResponseDto,
  DocumentChatThreadMessagesResponseDto,
  SendDocumentChatThreadMessageRequestDto,
  SendDocumentChatThreadMessageResponseDto,
} from '../../../shared/presentation/dtos/common.dto.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
import { CreateLibraryChatThreadUseCase } from '../application/create-library-chat-thread.use-case.js';
import { ListLibraryChatThreadsUseCase } from '../application/list-library-chat-threads.use-case.js';
import { SendLibraryChatThreadMessageUseCase } from '../application/send-library-chat-thread-message.use-case.js';
import { ListDocumentChatThreadMessagesUseCase } from '../../documents/application/list-document-chat-thread-messages.use-case.js';
import { StreamDocumentChatMessageUseCase } from '../../documents/application/stream-document-chat-message.use-case.js';
import { CancelDocumentChatGenerationUseCase } from '../../documents/application/cancel-document-chat-generation.use-case.js';
import { RetryDocumentChatMessageUseCase } from '../../documents/application/retry-document-chat-message.use-case.js';
import {
  toDocumentChatMessageRecordDto,
  toDocumentChatThreadDto,
} from '../../documents/presentation/document-chat.mapper.js';

@ApiDocuvateController('chat')
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly listLibraryThreads: ListLibraryChatThreadsUseCase,
    private readonly createLibraryThread: CreateLibraryChatThreadUseCase,
    private readonly sendLibraryMessage: SendLibraryChatThreadMessageUseCase,
    private readonly listThreadMessages: ListDocumentChatThreadMessagesUseCase,
    private readonly streamMessage: StreamDocumentChatMessageUseCase,
    private readonly cancelGeneration: CancelDocumentChatGenerationUseCase,
    private readonly retryMessage: RetryDocumentChatMessageUseCase
  ) {}

  @Get('threads')
  @ApiDocuvateRoute({ operationId: 'listLibraryChatThreads', summary: 'List library-scoped chat threads' })
  async listThreads(@Session() session: AuthSession): Promise<DocumentChatThreadListResponseDto> {
    const threads = await this.listLibraryThreads.execute(session.user.id);
    return { threads: threads.map(toDocumentChatThreadDto) };
  }

  @Post('threads')
  @ApiDocuvateRoute({ operationId: 'createLibraryChatThread', summary: 'Create library-scoped chat thread' })
  async createThread(
    @Session() session: AuthSession,
    @Body() body: CreateDocumentChatThreadRequestDto
  ) {
    const thread = await this.createLibraryThread.execute(session.user.id, body.title);
    return { thread: toDocumentChatThreadDto(thread) };
  }

  @Get('threads/:threadId/messages')
  @ApiDocuvateRoute({ operationId: 'listLibraryChatThreadMessages', summary: 'List messages in library chat thread' })
  async listMessages(
    @Session() session: AuthSession,
    @Param('threadId') threadId: string
  ): Promise<DocumentChatThreadMessagesResponseDto> {
    const messages = await this.listThreadMessages.executeLibrary(threadId, session.user.id);
    return { messages: messages.map(toDocumentChatMessageRecordDto) };
  }

  @Post('threads/:threadId/messages')
  @ApiDocuvateRoute({ operationId: 'sendLibraryChatThreadMessage', summary: 'Send message in library chat thread' })
  async sendMessage(
    @Session() session: AuthSession,
    @Param('threadId') threadId: string,
    @Body() body: SendDocumentChatThreadMessageRequestDto
  ): Promise<SendDocumentChatThreadMessageResponseDto> {
    const result = await this.sendLibraryMessage.execute(threadId, session.user.id, body.message);
    return {
      configured: result.configured,
      provider: result.provider,
      setupHint: result.setupHint,
      reply: result.reply,
      userMessage: toDocumentChatMessageRecordDto(result.userMessage),
      assistantMessage: toDocumentChatMessageRecordDto(result.assistantMessage),
      asyncGeneration: result.asyncGeneration,
    };
  }

  @Get('threads/:threadId/messages/:messageId/stream')
  @ApiDocuvateRoute({ operationId: 'streamLibraryChatMessage', summary: 'SSE stream for library chat message generation' })
  async stream(
    @Session() session: AuthSession,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string,
    @Req() req: FastifyRequest,
    @Res({ passthrough: false }) reply: FastifyReply
  ): Promise<void> {
    let closed = false;
    req.raw.on('close', () => {
      closed = true;
    });
    await this.streamMessage.executeLibrary(
      threadId,
      messageId,
      session.user.id,
      reply.raw,
      () => closed
    );
  }

  @Post('threads/:threadId/messages/:messageId/cancel')
  @ApiDocuvateRoute({ operationId: 'cancelLibraryChatGeneration', summary: 'Cancel library chat generation' })
  async cancel(
    @Session() session: AuthSession,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string
  ) {
    await this.cancelGeneration.executeLibrary(threadId, messageId, session.user.id);
    return { ok: true };
  }

  @Post('threads/:threadId/messages/:messageId/retry')
  @ApiDocuvateRoute({ operationId: 'retryLibraryChatMessage', summary: 'Retry failed library chat message' })
  async retry(
    @Session() session: AuthSession,
    @Param('threadId') threadId: string,
    @Param('messageId') messageId: string
  ) {
    const message = await this.retryMessage.executeLibrary(threadId, messageId, session.user.id);
    return { message: toDocumentChatMessageRecordDto(message) };
  }
}
