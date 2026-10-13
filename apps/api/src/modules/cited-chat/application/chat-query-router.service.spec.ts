// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EmbeddingPort } from '../../../shared/domain/ports.js';
import * as intentSchema from '../domain/chat-intent-prototypes.schema.js';
import type { ChatLibraryStatsService } from './chat-library-stats.service.js';
import { ChatQueryRouterService } from './chat-query-router.service.js';

describe('ChatQueryRouterService', () => {
  let router: ChatQueryRouterService;
  const embedTexts = vi.fn<EmbeddingPort['embedTexts']>();
  const tryAnswer = vi.fn<ChatLibraryStatsService['tryAnswer']>();

  beforeEach(() => {
    embedTexts.mockReset();
    tryAnswer.mockReset();
    vi.spyOn(intentSchema, 'classifyChatRouteIntent').mockReset();

    const libraryStats: ChatLibraryStatsService = { tryAnswer };
    router = new ChatQueryRouterService({ embedTexts }, libraryStats);
  });

  it('answers smalltalk on the current turn before retrieval routing', async () => {
    embedTexts.mockResolvedValue({ embeddings: [[0.1, 0.2]] });
    vi.spyOn(intentSchema, 'classifyChatRouteIntent').mockReturnValue('smalltalk');

    const result = await router.route({
      userId: 'u1',
      userMessage: 'hi',
      priorUserMessage: 'Was steht in der Rechnung?',
      scope: 'library',
      locale: 'de',
    });

    expect(result.kind).toBe('answered');
    if (result.kind === 'answered') {
      expect(result.content.length).toBeGreaterThan(0);
    }
    expect(tryAnswer).not.toHaveBeenCalled();
  });

  it('uses stats on the current turn when merged routing would stay document_qa', async () => {
    embedTexts.mockResolvedValue({ embeddings: [[0.3, 0.4], [0.5, 0.6]] });
    vi.spyOn(intentSchema, 'classifyChatRouteIntent')
      .mockReturnValueOnce('stats')
      .mockReturnValueOnce('document_qa');
    tryAnswer.mockResolvedValue('Sie haben 3 Dokumente.');

    const result = await router.route({
      userId: 'u1',
      userMessage: 'Wie viele Dokumente habe ich?',
      priorUserMessage: null,
      scope: 'library',
      locale: 'de',
    });

    expect(result.kind).toBe('answered');
    expect(tryAnswer).toHaveBeenCalled();
  });
});
