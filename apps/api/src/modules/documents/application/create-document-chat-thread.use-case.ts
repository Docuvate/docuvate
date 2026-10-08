import { Inject, Injectable } from '@nestjs/common';
import type { DocumentChatThreadEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentChatThreadRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import { DEFAULT_CHAT_THREAD_TITLE } from './chat-thread-title.js';

@Injectable()
export class CreateDocumentChatThreadUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    title?: string
  ): Promise<DocumentChatThreadEntity> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:chat', doc);
    return this.threads.createThread(userId, [documentId], {
      title: title?.trim() || DEFAULT_CHAT_THREAD_TITLE,
      scope: 'document',
    });
  }
}
