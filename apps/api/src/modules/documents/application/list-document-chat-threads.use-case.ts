// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { DocumentChatThreadEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentChatThreadRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListDocumentChatThreadsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentChatThreadEntity[]> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:chat', doc);
    return this.threads.listThreadsForDocument(documentId, userId);
  }
}
