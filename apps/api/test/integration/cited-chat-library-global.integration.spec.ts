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

const EMBED_DIM = 384;
const DECOY_CHUNK_COUNT = 70;

function int8Vector384(seed: number): { scale: number; bytes: Buffer; binaryCode: Buffer } {
  const bytes = Buffer.alloc(EMBED_DIM);
  for (let i = 0; i < EMBED_DIM; i += 1) {
    bytes.writeInt8(((i + seed) % 127) - 64, i);
  }
  return { scale: 0.01, bytes, binaryCode: Buffer.alloc(48, seed) };
}

function queryVector384(seed: number): number[] {
  const vector = int8Vector384(seed);
  return Array.from({ length: EMBED_DIM }, (_, i) => vector.bytes.readInt8(i) * vector.scale);
}

const queryEmbeddingPort: EmbeddingPort = {
  embedTexts(texts) {
    const vector = queryVector384(17);
    return Promise.resolve({ embeddings: texts.map(() => vector), model: 'test-embed' });
  },
};

describe('cited chat library global retrieval (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let answerDocId: string;
  let decoyDocId: string;
  let answerChunkId: string;
  let retrieval: PgCitedChatRetrievalRepository;
  let threads: PgDocumentChatThreadRepository;
  let generation: CitedChatGenerationService;
  let citations: PgChatMessageCitationsRepository;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Library global',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    answerDocId = randomUUID();
    decoyDocId = randomUUID();
    const answerText = 'Vertragsdetail Alpha: Jahresbeitrag Kfz 312,40 EUR laut Anlage.';
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1,$2,'answer.pdf','Versicherung Kfz','application/pdf','k/a','ready',$3),
              ($4,$2,'decoy.pdf','Decoy corpus','application/pdf','k/d','ready','filler only')`,
      [answerDocId, userId, answerText, decoyDocId]
    );

    const searchRepo = new PgGlobalSearchRepository(pool);
    const answerChunks = splitTextChunksWithSpans(answerText);
    const answerVectors = answerChunks.map(() => int8Vector384(17));
    await searchRepo.indexDocumentChunks(userId, answerDocId, answerChunks, undefined, {
      int8Vectors: answerVectors,
    });

    const decoyBodies = Array.from(
      { length: DECOY_CHUNK_COUNT },
      (_, i) => `alpha bravo charlie decoy segment ${String(i)} ohne relevante begriffe`
    );
    const decoyChunks = decoyBodies.flatMap((body) => splitTextChunksWithSpans(body));
    const decoyVectors = decoyChunks.map((_, i) => int8Vector384(90 + i));
    await searchRepo.indexDocumentChunks(userId, decoyDocId, decoyChunks, undefined, {
      int8Vectors: decoyVectors,
    });

    const chunkRow = await pool.query<{ id: string }>(
      `SELECT id FROM document_text_chunks WHERE document_id = $1 LIMIT 1`,
      [answerDocId]
    );
    answerChunkId = chunkRow.rows[0]?.id ?? '';

    retrieval = new PgCitedChatRetrievalRepository(pool);
    threads = new PgDocumentChatThreadRepository(pool);
    citations = new PgChatMessageCitationsRepository(pool);
    generation = new CitedChatGenerationService(
      threads,
      queryEmbeddingPort,
      retrieval,
      citations,
      passthroughChatQueryRouter()
    );
  }, 120_000);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('hybridRetrieveChunks finds answer chunk via dense retrieval across a large library', async () => {
    const question = 'semantische paraphrase fahrzeugversicherung jahreskosten';
    const candidates = await retrieval.hybridRetrieveChunks(userId, question, {
      queryVector: queryVector384(17),
    });
    expect(candidates.length).toBeGreaterThan(0);
    const hit = candidates.find((c) => c.documentId === answerDocId);
    expect(hit).toBeDefined();
    expect(hit?.body).toContain('312,40 EUR');
  });

  it('library-scoped generation cites indexed content when lexical retrieval misses', async () => {
    const question = 'semantische paraphrase fahrzeugversicherung jahreskosten';
    const queryVector = queryVector384(17);
    const retrieved = await retrieval.hybridRetrieveChunks(userId, question, { queryVector });
    expect(retrieved.some((c) => c.documentId === answerDocId && c.body.includes('312,40'))).toBe(
      true
    );

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
          const results = passageIds
            .map((id) => ({
              id,
              score: id === answerChunkId ? 0.99 : 0.12,
            }))
            .sort((a, b) => b.score - a.score);
          return Promise.resolve(
            new Response(
              JSON.stringify({
                results,
                reranker_used: true,
                reranker_model: 'test',
              }),
              { status: 200 }
            )
          );
        }
        if (url.includes('/api/chat')) {
          const payload = JSON.stringify({
            claims: [
              {
                text: 'Der Jahresbeitrag Kfz beträgt 312,40 EUR.',
                source: 'S1',
                quote: '312,40 EUR',
              },
            ],
          });
          const reqBody = parseRequestJsonRecord(init);
          if (readBooleanProperty(reqBody, 'stream')) {
            const line = `${JSON.stringify({ message: { content: payload }, done: true })}\n`;
            const stream = new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(line));
                controller.close();
              },
            });
            return Promise.resolve(
              new Response(stream, { status: 200, headers: { 'Content-Type': 'application/json' } })
            );
          }
          return Promise.resolve(
            new Response(JSON.stringify({ message: { content: payload } }), { status: 200 })
          );
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`));
      })
    );

    const thread = await threads.createThread(userId, [], { scope: 'library' });
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await generation.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: question,
      documentIds: [],
      scope: 'library',
    });

    expect(result.abstained).toBe(false);
    expect(result.content).not.toBe(CITED_CHAT_ABSTENTION_DE);
    expect(result.content).toContain('312,40');

    const stored = await citations.listForMessage(assistant.id);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.some((c) => c.chunkId === answerChunkId)).toBe(true);
  });
});
