// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  DOCUMENT_REPOSITORY,
  USER_PREFERENCES_REPOSITORY,
  type DocumentChatThreadEntity,
  type DocumentChatThreadRepository,
  type DocumentRepository,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { assertChatEnabled } from '../../settings/application/assert-chat-enabled.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';
import { resolveChatThreadTitle } from './chat-thread-title.js';

@Injectable()
export class CreateDocumentChatThreadUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase,
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
    const preferences = await this.prefs.getForUser(userId);
    const { customerEffective } = await this.effectiveChatProvider.resolveFromPreference(
      preferences.preferredChatProvider,
      { persistForUserId: userId }
    );
    assertChatEnabled(customerEffective);
    return this.threads.createThread(userId, [documentId], {
      title: resolveChatThreadTitle(title),
      scope: 'document',
    });
  }
}
