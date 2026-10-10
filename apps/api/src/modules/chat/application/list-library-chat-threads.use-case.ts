// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import type { DocumentChatThreadEntity } from '../../../shared/domain/ports.js';
import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListLibraryChatThreadsUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository
  ) {}

  async execute(userId: string): Promise<DocumentChatThreadEntity[]> {
    return this.threads.listThreadsForLibrary(userId);
  }
}
