// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import { DocumentChatGenerationActiveRegistry } from './document-chat-generation-active.registry.js';
import { DocumentChatGenerationQueueService } from './document-chat-generation-queue.service.js';
import { StaleChatGenerationReconcileService } from './stale-chat-generation-reconcile.service.js';

async function buildService(deps: {
  threads: Record<string, ReturnType<typeof vi.fn>>;
  activeRegistry: { isActive: ReturnType<typeof vi.fn> };
  generationQueue: { isJobQueuedOrActive: ReturnType<typeof vi.fn> };
}) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: StaleChatGenerationReconcileService,
        useFactory: (
          threads: DocumentChatThreadRepository,
          activeRegistry: DocumentChatGenerationActiveRegistry,
          generationQueue: DocumentChatGenerationQueueService
        ) => new StaleChatGenerationReconcileService(threads, activeRegistry, generationQueue),
        inject: [
          DOCUMENT_CHAT_THREAD_REPOSITORY,
          DocumentChatGenerationActiveRegistry,
          DocumentChatGenerationQueueService,
        ],
      },
      { provide: DOCUMENT_CHAT_THREAD_REPOSITORY, useValue: deps.threads },
      { provide: DocumentChatGenerationActiveRegistry, useValue: deps.activeRegistry },
      { provide: DocumentChatGenerationQueueService, useValue: deps.generationQueue },
    ],
  }).compile();
  return moduleRef.get(StaleChatGenerationReconcileService);
}

describe('StaleChatGenerationReconcileService', () => {
  it('skips reconcile when generation is active or queued', async () => {
    const threads = {
      listInFlightAssistantMessageIdsOlderThan: vi.fn().mockResolvedValue(['msg-1', 'msg-2']),
      failAssistantGenerationsByIds: vi.fn().mockResolvedValue(0),
    };
    const activeRegistry = {
      isActive: vi.fn((id: string) => Promise.resolve(id === 'msg-1')),
    };
    const generationQueue = {
      isJobQueuedOrActive: vi.fn((id: string) => Promise.resolve(id === 'msg-2')),
    };
    const service = await buildService({ threads, activeRegistry, generationQueue });

    expect(await service.shouldSkipStaleReconcile('msg-1')).toBe(true);
    expect(await service.shouldSkipStaleReconcile('msg-2')).toBe(true);
    expect(await service.shouldSkipStaleReconcile('msg-3')).toBe(false);
  });
});
