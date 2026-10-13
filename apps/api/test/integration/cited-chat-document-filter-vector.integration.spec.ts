// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CitedChatGenerationService } from '../../src/modules/cited-chat/application/cited-chat-generation.service.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgChatMessageCitationsRepository } from '../../src/modules/cited-chat/infrastructure/pg-chat-message-citations.repository.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgDocumentChatThreadRepository } from '../../src/modules/documents/infrastructure/pg-document-chat-thread.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import {
  createIntegrationResolveFeatureFlags,
  enableLocalChatModelForIntegration,
  enableLocalChatModelForIntegrationTenant,
} from '../helpers/cited-chat-integration-feature-flags.js';
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

describe('cited chat document filter + query vector (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let targetDocId: string;
  let otherDocId: string;
  let retrieval: PgCitedChatRetrievalRepository;
  let threads: PgDocumentChatThreadRepository;
  let generation: CitedChatGenerationService;
  let restoreLocalChatFlag: () => void;

  beforeAll(async () => {
    restoreLocalChatFlag = enableLocalChatModelForIntegration();
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Vector scope',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }
    await enableLocalChatModelForIntegrationTenant(pool, userId);

    targetDocId = randomUUID();
    otherDocId = randomUUID();
    const targetText = 'Liefermenge Widget A beträgt 42 Stück im Lieferschein Nord.';
    const otherText = 'Widget B Menge 99 Stück nur im anderen Dokument.';
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1,$2,'target.pdf','Lieferschein Widget A','application/pdf','k/t','ready',$3),
              ($4,$2,'other.pdf','Anderes Dokument','application/pdf','k/o','ready',$5)`,
      [targetDocId, userId, targetText, otherDocId, otherText]
    );

    const searchRepo = new PgGlobalSearchRepository(pool);
    const targetChunks = splitTextChunksWithSpans(targetText);
    const otherChunks = splitTextChunksWithSpans(otherText);
    const targetVectors = targetChunks.map((_, i) => int8Vector384(40 + i));
    const otherVectors = otherChunks.map((_, i) => int8Vector384(80 + i));
    await searchRepo.indexDocumentChunks(userId, targetDocId, targetChunks, undefined, {
      int8Vectors: targetVectors,
    });
    await searchRepo.indexDocumentChunks(userId, otherDocId, otherChunks, undefined, {
      int8Vectors: otherVectors,
    });

    retrieval = new PgCitedChatRetrievalRepository(pool);
    threads = new PgDocumentChatThreadRepository(pool);
    generation = new CitedChatGenerationService(
      threads,
      queryEmbeddingPort,
      retrieval,
      new PgChatMessageCitationsRepository(pool),
      passthroughChatQueryRouter(),
      createIntegrationResolveFeatureFlags(pool)
    );
  }, 60_000);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    restoreLocalChatFlag();
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('hybridRetrieveChunks applies document filter when loading dense vectors', async () => {
    const candidates = await retrieval.hybridRetrieveChunks(userId, 'Widget A Liefermenge', {
      documentIds: [targetDocId],
      queryVector: queryVector384(17),
    });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((c) => c.documentId === targetDocId)).toBe(true);
    expect(candidates.some((c) => c.body.includes('42'))).toBe(true);
  });

  it('document-scoped thread generation survives hybrid dense retrieval', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = requestUrl(input);
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
                text: 'Widget A: 42 Stück.',
                source: 'S1',
                quote: 'Widget A beträgt 42 Stück',
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

    const thread = await threads.createThread(userId, [targetDocId], { scope: 'document' });
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await generation.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: 'Wie viele Widget A sind geliefert?',
      documentIds: [targetDocId],
      scope: 'document',
    });
    expect(result.abstained).toBe(false);
    const updated = await threads.findMessageForUser(assistant.id, userId);
    expect(updated?.generationStatus).toBe('done');
  });
});
