// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CitedChatGenerationService } from '../../src/modules/cited-chat/application/cited-chat-generation.service.js';
import {
  attachPagesToChunks,
  splitTextChunksWithSpans,
} from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgChatMessageCitationsRepository } from '../../src/modules/cited-chat/infrastructure/pg-chat-message-citations.repository.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgDocumentChatThreadRepository } from '../../src/modules/documents/infrastructure/pg-document-chat-thread.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import { disabledExactFactChatDeps } from '../helpers/disabled-exact-fact-chat-deps.js';
import {
  parseRequestJsonRecord,
  readBooleanProperty,
  readPassageIds,
  requestUrl,
} from '../helpers/json.js';
import { passthroughChatQueryRouter } from '../helpers/passthrough-chat-query-router.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const noopEmbedding: EmbeddingPort = {
  embedTexts(texts: string[]) {
    return Promise.resolve({ embeddings: texts.map(() => []), model: 'noop' });
  },
};

describe('cited chat composed prose and citation page (Testcontainers)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let docId: string;
  let threads: PgDocumentChatThreadRepository;
  let citationsRepo: PgChatMessageCitationsRepository;
  let service: CitedChatGenerationService;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Prose',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    docId = randomUUID();
    const filler = 'X'.repeat(500);
    const text = `Deckblatt Einleitung. ${filler} Jahresüberschuss 26.870,52 EUR im Anhang. ${filler}`;
    const normalized = text.replace(/\s+/g, ' ');
    const blocks = [
      {
        page: 1,
        text: 'Deckblatt Einleitung.',
        block_index: 0,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
      {
        page: 7,
        text: 'Jahresüberschuss 26.870,52 EUR im Anhang.',
        block_index: 1,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ];

    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1,$2,'bericht.pdf','Jahresbericht','application/pdf','k/p','ready',$3)`,
      [docId, userId, normalized]
    );
    for (const block of blocks) {
      await pool.query(
        `INSERT INTO document_extraction_blocks
         (document_id, page, block_index, x, y, width, height, text, position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$3)`,
        [docId, block.page, block.block_index, block.x, block.y, block.width, block.height, block.text]
      );
    }

    const spans = attachPagesToChunks(splitTextChunksWithSpans(normalized), blocks);
    expect(spans.find((s) => s.body.includes('Jahresüberschuss'))?.page).toBe(7);
    await new PgGlobalSearchRepository(pool).indexDocumentChunks(userId, docId, spans);

    threads = new PgDocumentChatThreadRepository(pool);
    citationsRepo = new PgChatMessageCitationsRepository(pool);
    const exactFactDeps = disabledExactFactChatDeps();
    service = new CitedChatGenerationService(
      threads,
      noopEmbedding,
      new PgCitedChatRetrievalRepository(pool),
      citationsRepo,
      passthroughChatQueryRouter(),
      exactFactDeps.resolveFeatureFlags,
      exactFactDeps.exactFactQueryRouter,
      exactFactDeps.exactFactChat
    );
  }, 60_000);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  function ollamaStreamResponse(content: string): Response {
    const line = `${JSON.stringify({ message: { content }, done: true })}\n`;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(line));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  function mockRerankAndOllama(
    ollamaClaims: { text: string; source: string; quote: string }[]
  ) {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        if (url.includes('/v1/rag/extractive-answer')) {
          return Promise.resolve(
            new Response(JSON.stringify({}), { status: 200 })
          );
        }
        if (url.includes('/v1/rag/retrieve')) {
          const body = parseRequestJsonRecord(init);
          const passageIds = readPassageIds(body);
          const results = passageIds.map((id, i) => ({
            id,
            score: 0.95 - i * 0.05,
          }));
          return Promise.resolve(
            new Response(
              JSON.stringify({
                results,
                reranker_used: true,
                reranker_model: 'BAAI/bge-reranker-v2-m3-int8',
              }),
              { status: 200 }
            )
          );
        }
        if (url.includes('/api/chat')) {
          const payload = JSON.stringify({ claims: ollamaClaims });
          const reqBody = parseRequestJsonRecord(init);
          if (readBooleanProperty(reqBody, 'stream')) {
            return Promise.resolve(ollamaStreamResponse(payload));
          }
          return Promise.resolve(
            new Response(JSON.stringify({ message: { content: payload } }), { status: 200 })
          );
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`));
      })
    );
  }

  it('streams LLM prose and resolves citation page from blocks', async () => {
    mockRerankAndOllama([
      {
        text: 'Der Jahresüberschuss beträgt 26.870,52 EUR.',
        source: 'S1',
        quote: '26.870,52',
      },
    ]);

    const thread = await threads.createThread(userId, [docId], { scope: 'document' });
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });

    const result = await service.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: 'Wie hoch ist der Jahresüberschuss?',
      documentIds: [docId],
      scope: 'document',
      locale: 'de',
    });

    expect(result.abstained).toBe(false);
    expect(result.content).toContain('26.870,52');
    const listed = await citationsRepo.listForMessage(assistant.id);
    expect(listed[0]?.page).toBe(7);
  });

  it('abstains when the LLM returns a chunk dump claim', async () => {
    const junk =
      'Deckblatt und OCR Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz Randnotiz';
    mockRerankAndOllama([
      {
        text: `${junk} Jahresüberschuss 26.870,52 EUR ${junk}`,
        source: 'S1',
        quote: '26.870,52',
      },
    ]);

    const thread = await threads.createThread(userId, [docId], { scope: 'document' });
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });

    const result = await service.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: 'Wie hoch ist der Jahresüberschuss?',
      documentIds: [docId],
      scope: 'document',
      locale: 'de',
    });

    expect(result.abstained).toBe(true);
    expect(result.content).toContain('nichts gefunden');
  });
});
