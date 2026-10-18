// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import type { DocumentChatThreadEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { resolveChatThreadTitle } from '../../documents/application/chat-thread-title.js';
import { assertChatEnabled } from '../../settings/application/assert-chat-enabled.js';
import { EffectiveDocumentChatProviderUseCase } from '../../settings/application/effective-document-chat-provider.use-case.js';

@Injectable()
export class CreateLibraryChatThreadUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase
  ) {}

  async execute(userId: string, title?: string): Promise<DocumentChatThreadEntity> {
    const preferences = await this.prefs.getForUser(userId);
    const { customerEffective } = await this.effectiveChatProvider.resolveFromPreference(
      preferences.preferredChatProvider,
      { persistForUserId: userId }
    );
    assertChatEnabled(customerEffective);
    return this.threads.createThread(userId, [], {
      title: resolveChatThreadTitle(title),
      scope: 'library',
    });
  }
}
