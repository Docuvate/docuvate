// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CursorListQuery, DocumentChatThreadListResponse } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import { clampCursorListLimit } from '../../../shared/infrastructure/pagination/clamp-cursor-list-limit.js';
import { toDocumentChatThreadDto } from '../../documents/presentation/document-chat.mapper.js';

@Injectable()
export class ListLibraryChatThreadsUseCase {
  constructor(
    @Inject(DOCUMENT_CHAT_THREAD_REPOSITORY)
    private readonly threads: DocumentChatThreadRepository
  ) {}

  async execute(userId: string, pagination: CursorListQuery): Promise<DocumentChatThreadListResponse> {
    const limit = clampCursorListLimit(pagination.limit);
    const page = await this.threads.listThreadsForLibrary(userId, {
      limit,
      cursor: pagination.cursor,
    });
    return {
      threads: page.threads.map(toDocumentChatThreadDto),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  }
}
