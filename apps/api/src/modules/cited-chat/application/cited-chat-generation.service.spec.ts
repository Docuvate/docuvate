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
import { ChatQueryRouterService } from './chat-query-router.service.js';
import { CitedChatGenerationService } from './cited-chat-generation.service.js';

vi.mock('../infrastructure/fetch-worker-rag-rerank.js', () => ({
  fetchWorkerRagRerank: vi.fn(),
}));

vi.mock('../infrastructure/fetch-worker-extractive-answer.js', () => ({
  fetchWorkerExtractiveAnswer: vi.fn().mockResolvedValue({
    reachable: false,
    passageId: null,
    answer: null,
    quote: null,
  }),
}));

vi.mock('./cited-chat-ollama.js', () => ({
  buildCitedChatSystemPrompt: vi.fn(() => 'system'),
  requestCitedAnswerFromOllama: vi.fn(),
}));

import { fetchWorkerExtractiveAnswer } from '../infrastructure/fetch-worker-extractive-answer.js';
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
      loadDocumentContextMeta?: ReturnType<typeof vi.fn>;
      supplementContextualLibraryCandidates?: ReturnType<typeof vi.fn>;
      listTenantLabelNames?: ReturnType<typeof vi.fn>;
      resolvePrimaryTextChunkId?: ReturnType<typeof vi.fn>;
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
          citations: PgChatMessageCitationsRepository,
          queryRouter: ChatQueryRouterService
        ) => {
          const resolveFeatureFlags = {
            execute: vi.fn().mockResolvedValue({ exactAnswers: false, answerAbstention: false }),
          };
          const exactFactQueryRouter = { parse: vi.fn().mockReturnValue(null) };
          const exactFactChat = { execute: vi.fn().mockResolvedValue(null) };
          return new CitedChatGenerationService(
            threads,
            embedding,
            retrieval,
            citations,
            queryRouter,
            // @ts-expect-error test doubles — generation only calls execute/parse
            resolveFeatureFlags,
            exactFactQueryRouter,
            exactFactChat
          );
        },
        inject: [
          DOCUMENT_CHAT_THREAD_REPOSITORY,
          EMBEDDING_PORT,
          PgCitedChatRetrievalRepository,
          PgChatMessageCitationsRepository,
          ChatQueryRouterService,
        ],
      },
      {
        provide: ChatQueryRouterService,
        useValue: {
          route: vi.fn(({ userMessage }: { userMessage: string }) =>
            Promise.resolve({
              kind: 'document_qa',
              resolvedQuery: userMessage,
            })
          ),
        },
      },
      { provide: DOCUMENT_CHAT_THREAD_REPOSITORY, useValue: deps.threads },
      {
        provide: EMBEDDING_PORT,
        useValue: { embedTexts: vi.fn().mockResolvedValue({ embeddings: [[0.1]] }) },
      },
      {
        provide: PgCitedChatRetrievalRepository,
        useValue: {
          loadDocumentContextMeta:
            deps.retrieval.loadDocumentContextMeta ??
            vi.fn().mockResolvedValue(new Map()),
          supplementContextualLibraryCandidates:
            deps.retrieval.supplementContextualLibraryCandidates ??
            vi.fn().mockResolvedValue([]),
          supplementLabelAlignedLibraryCandidates:
            deps.retrieval.supplementLabelAlignedLibraryCandidates ??
            vi.fn().mockResolvedValue([]),
          listTenantLabelNames:
            deps.retrieval.listTenantLabelNames ?? vi.fn().mockResolvedValue([]),
          resolvePrimaryTextChunkId:
            deps.retrieval.resolvePrimaryTextChunkId ?? vi.fn().mockResolvedValue(null),
          ...deps.retrieval,
        },
      },
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
    process.env['RAG_RERANKER_GATE_MIN'] = '0.21';
    process.env['RAG_FUSION_GATE_MIN'] = '0.02';
    delete process.env['OLLAMA_URL'];
    vi.mocked(fetchWorkerExtractiveAnswer).mockResolvedValue({
      reachable: false,
      passageId: null,
      answer: null,
      quote: null,
    });
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

  it('returns extractive text without Ollama when chunk id is lexical-only', async () => {
    process.env['OLLAMA_URL'] = '';
    vi.mocked(fetchWorkerExtractiveAnswer).mockResolvedValue({
      reachable: true,
      passageId: 'lexical-block-doc-0',
      answer: 'Widget A Menge 2 Stück.',
      quote: 'Widget A Menge 2 Stück.',
    });
    vi.mocked(fetchWorkerRagRerank).mockResolvedValue({
      reachable: true,
      rerankerUsed: true,
      rerankerModel: 'BAAI/bge-reranker-base',
      results: [{ id: 'lexical-block-doc-0', score: 0.9 }],
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
          chunkId: 'lexical-block-doc-0',
          documentId: 'd1',
          documentTitle: 'Lieferschein',
          body: 'Widget A Menge 2 Stück.',
          page: 1,
          charStart: 0,
          charEnd: 24,
          fusionScore: 0.9,
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
      userMessage: 'Wie viele Widget A?',
      documentIds: ['d1'],
      scope: 'document',
    });

    expect(requestCitedAnswerFromOllama).not.toHaveBeenCalled();
    expect(result.abstained).toBe(false);
    expect(result.content).toMatch(/Widget A/i);
    expect(citations.replaceCitations).toHaveBeenCalledWith(messageId, []);
    delete process.env['OLLAMA_URL'];
  });

  it('falls back to extractive answer when Ollama is unreachable', async () => {
    process.env['OLLAMA_URL'] = 'http://127.0.0.1:11434';
    vi.mocked(fetchWorkerRagRerank).mockResolvedValue({
      reachable: true,
      rerankerUsed: true,
      rerankerModel: 'BAAI/bge-reranker-base',
      results: [{ id: 'c1', score: 0.9 }],
    });
    vi.mocked(requestCitedAnswerFromOllama).mockResolvedValue({
      ok: false,
      detail: 'network_error',
    });
    vi.mocked(fetchWorkerExtractiveAnswer).mockResolvedValue({
      reachable: true,
      passageId: 'c1',
      answer: 'Gesamtsumme 1.234,56 EUR',
      quote: 'Gesamtsumme 1.234,56 EUR',
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
          charEnd: 24,
          fusionScore: 0.9,
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
      documentIds: ['d1'],
      scope: 'document',
    });

    expect(result.abstained).toBe(false);
    expect(result.content).toMatch(/1\.234,56/);
    expect(threads.updateMessageGeneration).toHaveBeenCalledWith(
      messageId,
      expect.objectContaining({ generationStatus: 'done' })
    );
    expect(threads.updateMessageGeneration).not.toHaveBeenCalledWith(
      messageId,
      expect.objectContaining({ generationStatus: 'failed' })
    );
    delete process.env['OLLAMA_URL'];
  });

  it('answers when the local model returns empty quotes but a grounded claim', async () => {
    process.env['OLLAMA_URL'] = 'http://127.0.0.1:11434';
    vi.mocked(fetchWorkerRagRerank).mockResolvedValue({
      reachable: true,
      rerankerUsed: true,
      rerankerModel: 'BAAI/bge-reranker-base',
      results: [{ id: 'c1', score: 0.92 }],
    });
    vi.mocked(requestCitedAnswerFromOllama).mockResolvedValue({
      ok: true,
      parsed: {
        claims: [
          {
            text: 'Gesamtbrutto 4.321,00 EUR',
            source: 'S1',
            quote: '',
          },
        ],
      },
    });
    vi.mocked(fetchWorkerExtractiveAnswer).mockResolvedValue({
      reachable: false,
      passageId: null,
      answer: null,
      quote: null,
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
          documentTitle: 'Entgelt',
          body: 'Gesamtbrutto 4.321,00 EUR',
          page: 1,
          charStart: 0,
          charEnd: 26,
          fusionScore: 0.9,
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
      userMessage: 'Wie hoch ist das Gesamtbrutto?',
      documentIds: [],
      scope: 'library',
    });

    expect(result.abstained).toBe(false);
    expect(result.content).toMatch(/4\.321,00/);
    expect(citations.replaceCitations).toHaveBeenCalled();
    delete process.env['OLLAMA_URL'];
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
