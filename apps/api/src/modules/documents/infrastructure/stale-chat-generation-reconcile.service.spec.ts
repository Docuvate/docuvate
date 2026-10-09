// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { StaleChatGenerationReconcileService } from './stale-chat-generation-reconcile.service.js';

describe('StaleChatGenerationReconcileService', () => {
  it('skips reconcile when generation is active or queued', async () => {
    const threads = {
      listInFlightAssistantMessageIdsOlderThan: vi.fn().mockResolvedValue(['msg-1', 'msg-2']),
      failAssistantGenerationsByIds: vi.fn().mockResolvedValue(0),
    };
    const activeRegistry = {
      isActive: vi.fn(async (id: string) => id === 'msg-1'),
    };
    const generationQueue = {
      isJobQueuedOrActive: vi.fn(async (id: string) => id === 'msg-2'),
    };
    const service = new StaleChatGenerationReconcileService(
      threads as never,
      activeRegistry as never,
      generationQueue as never
    );

    expect(await service.shouldSkipStaleReconcile('msg-1')).toBe(true);
    expect(await service.shouldSkipStaleReconcile('msg-2')).toBe(true);
    expect(await service.shouldSkipStaleReconcile('msg-3')).toBe(false);
  });
});
