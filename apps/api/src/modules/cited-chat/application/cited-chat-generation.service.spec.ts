// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_CHAT_THREAD_REPOSITORY,
  type DocumentChatThreadRepository,
  EMBEDDING_PORT,
  type EmbeddingPort,
} from '../../../shared/domain/ports.js';
import { CITED_CHAT_ABSTENTION_DE } from '../domain/cited-chat-constants.js';
import { PgChatMessageCitationsRepository } from '../infrastructure/pg-chat-message-citations.repository.js';
import { PgCitedChatRetrievalRepository } from '../infrastructure/pg-cited-chat-retrieval.repository.js';
import { CitedChatGenerationService } from './cited-chat-generation.service.js';

vi.mock('../infrastructure/fetch-worker-rag-rerank.js', () => ({
  fetchWorkerRagRerank: vi.fn(),
}));

vi.mock('./cited-chat-ollama.js', () => ({
  buildCitedChatSystemPrompt: vi.fn(() => 'system'),
  requestCitedAnswerFromOllama: vi.fn(),
}));

import { fetchWorkerRagRerank } from '../infrastructure/fetch-worker-rag-rerank.js';
import { requestCitedAnswerFromOllama } from './cited-chat-ollama.js';

const messageId = 'msg-1';
const threadId = 'thread-1';
const userId = 'user-1';

async function buildService(deps: {
  threads: Record<string, ReturnType<typeof vi.fn>>;
  retrieval: {
    hybridRetrieveChunks: ReturnType<typeof vi.fn>;
    indexPassageForRerank: (c: { documentTitle: string; body: string }) => string;
  };
  citations?: { replaceCitations: ReturnType<typeof vi.fn> };
}) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: CitedChatGenerationService,
        useFactory: (
          threads: DocumentChatThreadRepository,
          embedding: EmbeddingPort,
          retrieval: PgCitedChatRetrievalRepository,
          citations: PgChatMessageCitationsRepository
        ) => new CitedChatGenerationService(threads, embedding, retrieval, citations),
        inject: [
          DOCUMENT_CHAT_THREAD_REPOSITORY,
          EMBEDDING_PORT,
          PgCitedChatRetrievalRepository,
          PgChatMessageCitationsRepository,
        ],
      },
      { provide: DOCUMENT_CHAT_THREAD_REPOSITORY, useValue: deps.threads },
      {
        provide: EMBEDDING_PORT,
        useValue: { embedTexts: vi.fn().mockResolvedValue({ embeddings: [[0.1]] }) },
      },
      { provide: PgCitedChatRetrievalRepository, useValue: deps.retrieval },
      {
        provide: PgChatMessageCitationsRepository,
        useValue: deps.citations ?? { replaceCitations: vi.fn() },
      },
    ],
  }).compile();
  return moduleRef.get(CitedChatGenerationService);
}

describe('CitedChatGenerationService abstention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAG_RERANKER_GATE_MIN = '0.21';
    process.env.RAG_FUSION_GATE_MIN = '0.02';
  });

  it('abstains on off-topic reranker score', async () => {
    vi.mocked(fetchWorkerRagRerank).mockResolvedValue({
      reachable: true,
      rerankerUsed: true,
      rerankerModel: 'BAAI/bge-reranker-base',
      results: [{ id: 'c1', score: 0.01 }],
    });

    const threads = {
      updateMessageGeneration: vi.fn(),
      touchThread: vi.fn(),
      listMessages: vi.fn().mockResolvedValue([]),
      findMessageForUser: vi.fn().mockResolvedValue({ content: '' }),
    };
    const retrieval = {
      hybridRetrieveChunks: vi.fn().mockResolvedValue([
        {
          chunkId: 'c1',
          documentId: 'd1',
          documentTitle: 'Doc',
          body: 'irrelevant',
          page: 1,
          charStart: 0,
          charEnd: 10,
          fusionScore: 0.03,
        },
      ]),
      indexPassageForRerank: (c: { documentTitle: string; body: string }) =>
        `${c.documentTitle}\n${c.body}`,
    };
    const service = await buildService({ threads, retrieval });

    const result = await service.generate({
      messageId,
      threadId,
      userId,
      userMessage: 'Wetter morgen?',
      documentIds: [],
      scope: 'library',
    });

    expect(result.abstained).toBe(true);
    expect(result.content).toBe(CITED_CHAT_ABSTENTION_DE);
    expect(threads.updateMessageGeneration).toHaveBeenCalled();
  });

  it('abstains when reranker is down and fusion is weak', async () => {
    vi.mocked(fetchWorkerRagRerank).mockResolvedValue({
      reachable: false,
      rerankerUsed: false,
      rerankerModel: null,
      results: [],
    });

    const threads = {
      updateMessageGeneration: vi.fn(),
      touchThread: vi.fn(),
      listMessages: vi.fn().mockResolvedValue([]),
      findMessageForUser: vi.fn().mockResolvedValue({ content: '' }),
    };
    const retrieval = {
      hybridRetrieveChunks: vi.fn().mockResolvedValue([
        {
          chunkId: 'c1',
          documentId: 'd1',
          documentTitle: 'Doc',
          body: 'noise',
          page: 1,
          charStart: 0,
          charEnd: 5,
          fusionScore: 0.01,
        },
      ]),
      indexPassageForRerank: (c: { documentTitle: string; body: string }) =>
        `${c.documentTitle}\n${c.body}`,
    };
    const service = await buildService({ threads, retrieval });

    const result = await service.generate({
      messageId,
      threadId,
      userId,
      userMessage: 'Bitcoin?',
      documentIds: [],
      scope: 'library',
    });

    expect(result.abstained).toBe(true);
    expect(result.content).toBe(CITED_CHAT_ABSTENTION_DE);
  });

  it('stops when shouldAbort is set during streaming', async () => {
    vi.mocked(fetchWorkerRagRerank).mockResolvedValue({
      reachable: true,
      rerankerUsed: true,
      rerankerModel: 'BAAI/bge-reranker-v2-m3-int8',
      results: [{ id: 'c1', score: 0.9 }],
    });

    vi.mocked(requestCitedAnswerFromOllama).mockResolvedValue({
      ok: false,
      detail: 'cancelled',
    });

    const threads = {
      updateMessageGeneration: vi.fn(),
      touchThread: vi.fn(),
      listMessages: vi.fn().mockResolvedValue([]),
      findMessageForUser: vi.fn().mockResolvedValue({ content: '' }),
    };
    const citations = { replaceCitations: vi.fn() };
    const retrieval = {
      hybridRetrieveChunks: vi.fn().mockResolvedValue([
        {
          chunkId: 'c1',
          documentId: 'd1',
          documentTitle: 'Doc',
          body: 'Gesamtsumme 1.234,56 EUR',
          page: 1,
          charStart: 0,
          charEnd: 20,
          fusionScore: 0.05,
        },
      ]),
      indexPassageForRerank: (c: { documentTitle: string; body: string }) =>
        `${c.documentTitle}\n${c.body}`,
    };
    const service = await buildService({ threads, retrieval, citations });

    const result = await service.generate({
      messageId,
      threadId,
      userId,
      userMessage: 'Summe?',
      documentIds: [],
      scope: 'library',
      shouldAbort: () => true,
    });

    expect(result.abstained).toBe(true);
    expect(threads.updateMessageGeneration).toHaveBeenCalledWith(
      messageId,
      expect.objectContaining({ generationStatus: 'failed', errorCode: 'cancelled' })
    );
  });
});
