// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { toDocumentChatMessageRecordDto } from './document-chat-message.mapper.js';

describe('toDocumentChatMessageRecordDto', () => {
  it('exposes generation fields for assistant messages', () => {
    const dto = toDocumentChatMessageRecordDto({
      id: 'm1',
      threadId: 't1',
      role: 'assistant',
      content: 'partial',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:01:00Z'),
      generationStatus: 'streaming',
      generationPhase: 'generating',
      errorCode: null,
      errorDetail: null,
    });
    expect(dto.generationStatus).toBe('streaming');
    expect(dto.errorCode).toBeNull();
    expect(dto.updatedAt).toBe('2026-01-01T00:01:00.000Z');
  });

  it('maps failed assistant errors without leaking admin detail', () => {
    const dto = toDocumentChatMessageRecordDto({
      id: 'm2',
      threadId: 't1',
      role: 'assistant',
      content: '',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:02:00Z'),
      generationStatus: 'failed',
      generationPhase: null,
      errorCode: 'generation_timeout',
      errorDetail: 'Ollama idle timeout',
    });
    expect(dto.generationStatus).toBe('failed');
    expect(dto.errorCode).toBe('generation_timeout');
    expect(Object.keys(dto)).not.toContain('errorDetail');
    expect(dto.citedBenchStats).toBeUndefined();
  });

  it('exposes citedBenchStats from error_detail JSON', () => {
    const dto = toDocumentChatMessageRecordDto({
      id: 'm3',
      threadId: 't1',
      role: 'assistant',
      content: 'ok',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:03:00Z'),
      generationStatus: 'done',
      generationPhase: null,
      errorCode: null,
      errorDetail: '{"citedRejectedClaims":2}',
    });
    expect(dto.citedBenchStats).toEqual({ citedRejectedClaims: 2 });
  });
});
