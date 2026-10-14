// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CitedChatGenerationService } from '../../src/modules/cited-chat/application/cited-chat-generation.service.js';
import { CITED_CHAT_ABSTENTION_DE } from '../../src/modules/cited-chat/domain/cited-chat-constants.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
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

const PAYSLIP_COUNT = 57;
const EMBED_DIM = 384;
const OCTOBER_GROSS = '4.859,67';

function int8Vector384(seed: number): { scale: number; bytes: Buffer; binaryCode: Buffer } {
  const bytes = Buffer.alloc(EMBED_DIM);
  for (let i = 0; i < EMBED_DIM; i += 1) {
    bytes.writeInt8(((i + seed) % 127) - 64, i);
  }
  return { scale: 0.01, bytes, binaryCode: Buffer.alloc(48, seed % 255) };
}

function queryVector384(seed: number): number[] {
  const vector = int8Vector384(seed);
  return Array.from({ length: EMBED_DIM }, (_, i) => vector.bytes.readInt8(i) * vector.scale);
}

const embeddingPort: EmbeddingPort = {
  embedTexts(texts: string[]) {
    return Promise.resolve({
      embeddings: texts.map(() => queryVector384(42)),
      model: 'test-e5-small',
    });
  },
};

describe('cited chat library payslip corpus (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let octoberDocId: string;
  let threads: PgDocumentChatThreadRepository;
  let service: CitedChatGenerationService;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Payslip library',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    octoberDocId = randomUUID();
    const searchRepo = new PgGlobalSearchRepository(pool);

    for (let month = 1; month <= PAYSLIP_COUNT; month += 1) {
      const docId = month === 10 ? octoberDocId : randomUUID();
      const monthPadded = String(month).padStart(2, '0');
      const gross =
        month === 10 ? OCTOBER_GROSS : `${String(4000 + month)},00`;
      const body = `Entgeltnachweis ${monthPadded}/2024\nGesamtbrutto ${gross} EUR\nNettoentgelt ${String(3000 + month)},00 EUR`;
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, document_date)
         VALUES ($1,$2,$3,$4,'application/pdf',$5,'ready',$6,$7)`,
        [
          docId,
          userId,
          `2024_${monthPadded}.pdf`,
          `Entgeltnachweis ${monthPadded}/2024`,
          `k/payslip-${monthPadded}`,
          body,
          `2024-${monthPadded}-28`,
        ]
      );
      const chunks = splitTextChunksWithSpans(body);
      const vectors = chunks.map((_, chunkIndex) => int8Vector384(month * 10 + chunkIndex));
      await searchRepo.indexDocumentChunks(userId, docId, chunks, undefined, {
        int8Vectors: vectors,
      });
    }

    threads = new PgDocumentChatThreadRepository(pool);
    const retrieval = new PgCitedChatRetrievalRepository(pool);
    const exactFactDeps = disabledExactFactChatDeps();
    service = new CitedChatGenerationService(
      threads,
      embeddingPort,
      retrieval,
      new PgChatMessageCitationsRepository(pool),
      passthroughChatQueryRouter(),
      exactFactDeps.resolveFeatureFlags,
      exactFactDeps.exactFactQueryRouter,
      exactFactDeps.exactFactChat
    );
  }, 180_000);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  function mockRerankAndOllama(
    ollamaClaims: { text: string; source: string; quote: string }[]
  ) {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
        if (url.includes('/v1/rag/extractive-answer')) {
          return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
        }
        if (url.includes('/v1/rag/retrieve')) {
          const body = parseRequestJsonRecord(init);
          const passageIds = readPassageIds(body);
          const results = passageIds.map((id, index) => ({
            id,
            score: 0.91 - index * 0.001,
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
            const line = `${JSON.stringify({ message: { content: payload }, done: true })}\n`;
            const stream = new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(line));
                controller.close();
              },
            });
            return Promise.resolve(new Response(stream, { status: 200 }));
          }
          return Promise.resolve(
            new Response(JSON.stringify({ message: { content: payload } }), { status: 200 })
          );
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`));
      })
    );
  }

  it('answers October Gesamtbrutto across a ~57-document payslip library', async () => {
    mockRerankAndOllama([
      {
        text: `Das Gesamtbrutto im Entgeltnachweis Oktober 2024 beträgt ${OCTOBER_GROSS} EUR.`,
        source: 'S1',
        quote: `Gesamtbrutto ${OCTOBER_GROSS} EUR`,
      },
    ]);

    const thread = await threads.createThread(userId, [], { scope: 'library' });
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });

    const question =
      'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?';
    const result = await service.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: question,
      documentIds: [],
      scope: 'library',
      locale: 'de',
    });

    expect(result.abstained).toBe(false);
    expect(result.content).not.toBe(CITED_CHAT_ABSTENTION_DE);
    expect(result.content).toContain('4.859');

    const citations = await pool.query<{ document_id: string }>(
      `SELECT c.document_id
       FROM chat_message_citations cm
       JOIN document_text_chunks c ON c.id = cm.chunk_id
       WHERE cm.message_id = $1`,
      [assistant.id]
    );
    expect(citations.rows.some((row) => row.document_id === octoberDocId)).toBe(true);
  });
});
