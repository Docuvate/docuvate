import { Inject, Injectable } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { DocumentChatMessageStreamEvent } from '@docuvate/contracts';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { toDocumentChatMessageRecordDto } from './document-chat-message.mapper.js';
import { isTerminalGenerationStatus } from './document-chat-generation-status.js';

const POLL_MS = 400;
const MAX_STREAM_MS = 30 * 60 * 1000;

@Injectable()
export class StreamDocumentChatMessageUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository
  ) {}

  async execute(
    documentId: string,
    threadId: string,
    messageId: string,
    userId: string,
    rawResponse: ServerResponse,
    isClientClosed: () => boolean
  ): Promise<void> {
    await this.threads.assertThreadLinkedToDocument(threadId, documentId, userId);

    rawResponse.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const started = Date.now();
    let lastContent = '';

    const writeEvent = (event: DocumentChatMessageStreamEvent) => {
      rawResponse.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    while (!isClientClosed() && Date.now() - started < MAX_STREAM_MS) {
      const message = await this.threads.findMessageForUser(messageId, userId);
      if (!message || message.threadId !== threadId) {
        throw new NotFoundError('Chat message');
      }

      const dto = toDocumentChatMessageRecordDto(message);
      const status = dto.generationStatus ?? 'done';
      let type: DocumentChatMessageStreamEvent['type'] = 'snapshot';
      if (message.content !== lastContent && message.content.length > 0) {
        type = lastContent.length === 0 ? 'snapshot' : 'token';
        lastContent = message.content;
      }
      if (message.generationPhase === 'retrieving') {
        type = 'phase';
      }
      if (status === 'done') {
        type = 'done';
      } else if (status === 'failed') {
        type = message.errorCode === 'cancelled' ? 'cancelled' : 'failed';
      }

      writeEvent({ type, message: dto });

      if (isTerminalGenerationStatus(status)) {
        break;
      }

      await sleep(POLL_MS);
    }

    rawResponse.end();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
