import { Inject, Injectable } from '@nestjs/common';
import type { DocumentChatMessageEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentChatThreadRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';

@Injectable()
export class ListDocumentChatThreadMessagesUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    threadId: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentChatMessageEntity[]> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:chat', doc);
    await this.threads.assertThreadLinkedToDocument(threadId, documentId, userId);
    return this.threads.listMessages(threadId, userId);
  }
}
