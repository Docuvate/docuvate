import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CitedChatGenerationService } from '../../src/modules/cited-chat/application/cited-chat-generation.service.js';
import { CITED_CHAT_ABSTENTION_DE } from '../../src/modules/cited-chat/domain/cited-chat-constants.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgChatMessageCitationsRepository } from '../../src/modules/cited-chat/infrastructure/pg-chat-message-citations.repository.js';
import { PgDocumentChatThreadRepository } from '../../src/modules/documents/infrastructure/pg-document-chat-thread.repository.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

const noopEmbedding: EmbeddingPort = {
  async embedTexts(texts: string[]) {
    return { embeddings: texts.map(() => []), model: 'noop' };
  },
};

describe('cited chat German fixtures (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let invoiceDocId: string;
  let taxDocId: string;
  let threads: PgDocumentChatThreadRepository;
  let retrieval: PgCitedChatRetrievalRepository;
  let service: CitedChatGenerationService;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'Cited', email: `${userId}@example.test` });
    } finally {
      client.release();
    }

    invoiceDocId = randomUUID();
    taxDocId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1,$2,'rechnung.pdf','Rechnung Nordwind GmbH','application/pdf','k/1','ready',$3),
              ($4,$2,'steuer.pdf','Bescheid Hundesteuer','application/pdf','k/2','ready',$5)`,
      [
        invoiceDocId,
        userId,
        'Rechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000',
        taxDocId,
        'Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR',
      ]
    );

    const searchRepo = new PgGlobalSearchRepository(pool);
    await searchRepo.indexDocumentChunks(
      userId,
      invoiceDocId,
      splitTextChunksWithSpans(
        'Rechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000'
      )
    );
    await searchRepo.indexDocumentChunks(
      userId,
      taxDocId,
      splitTextChunksWithSpans('Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR')
    );

    threads = new PgDocumentChatThreadRepository(pool);
    retrieval = new PgCitedChatRetrievalRepository(pool);
    service = new CitedChatGenerationService(
      threads,
      noopEmbedding,
      retrieval,
      new PgChatMessageCitationsRepository(pool)
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

  function mockRerankAndOllama(ollamaClaims: Array<{ text: string; source: string; quote: string }>) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/v1/rag/retrieve')) {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            passages: Array<{ id: string }>;
          };
          const results = body.passages.map((p, i) => ({
            id: p.id,
            score: 0.95 - i * 0.05,
          }));
          return new Response(
            JSON.stringify({
              results,
              reranker_used: true,
              reranker_model: 'BAAI/bge-reranker-v2-m3-int8',
            }),
            { status: 200 }
          );
        }
        if (url.includes('/api/chat')) {
          const payload = JSON.stringify({ claims: ollamaClaims });
          const reqBody = JSON.parse(String(init?.body ?? '{}')) as { stream?: boolean };
          if (reqBody.stream) {
            return ollamaStreamResponse(payload);
          }
          return new Response(
            JSON.stringify({
              message: { content: payload },
            }),
            { status: 200 }
          );
        }
        throw new Error(`unexpected fetch ${url}`);
      })
    );
  }

  async function createLibraryThread(): Promise<string> {
    const thread = await threads.createThread(userId, [], { scope: 'library' });
    expect(thread.documentIds).toEqual([]);
    const listed = await threads.findThreadForUser(thread.id, userId);
    expect(listed?.documentIds).toEqual([]);
    return thread.id;
  }

  it('library thread without linked documents does not pass invalid document ids to retrieval', async () => {
    mockRerankAndOllama([
      {
        text: 'Gesamtsumme: 1.234,56 EUR',
        source: 'S1',
        quote: 'Gesamtsumme: 1.234,56 EUR',
      },
    ]);
    const threadId = await createLibraryThread();
    const assistant = await threads.appendMessage(threadId, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await service.generate({
      messageId: assistant.id,
      threadId,
      userId,
      userMessage: 'Welche Gesamtsumme steht auf der Rechnung Nordwind?',
      documentIds: ['null'],
      scope: 'library',
    });
    expect(result.abstained).toBe(false);
    const updated = await threads.findMessageForUser(assistant.id, userId);
    expect(updated?.generationStatus).toBe('done');
    expect(updated?.content).toContain('1.234,56');
  });

  it('document-scoped thread answers from a single linked document', async () => {
    mockRerankAndOllama([
      { text: 'Hundesteuer: 120,00 EUR', source: 'S1', quote: 'Jahresgebühr: 120,00 EUR' },
    ]);
    const thread = await threads.createThread(userId, [taxDocId], { scope: 'document' });
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await service.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: 'Was kostet die Hundesteuer?',
      documentIds: [taxDocId],
      scope: 'document',
    });
    expect(result.abstained).toBe(false);
    expect(result.content).toContain('120');
  });

  it('abstains on off-topic question when reranker score is low', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/v1/rag/retrieve')) {
          return new Response(
            JSON.stringify({
              results: [{ id: 'c1', score: 0.02 }],
              reranker_used: true,
              reranker_model: 'BAAI/bge-reranker-v2-m3-int8',
            }),
            { status: 200 }
          );
        }
        throw new Error(`unexpected fetch ${url}`);
      })
    );
    const threadId = await createLibraryThread();
    const assistant = await threads.appendMessage(threadId, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await service.generate({
      messageId: assistant.id,
      threadId,
      userId,
      userMessage: 'Wie wird das Wetter morgen in Berlin?',
      documentIds: [],
      scope: 'library',
    });
    expect(result.abstained).toBe(true);
    expect(result.content).toBe(CITED_CHAT_ABSTENTION_DE);
    const citations = await pool.query(
      'SELECT COUNT(*)::int AS n FROM chat_message_citations WHERE message_id = $1',
      [assistant.id]
    );
    expect(citations.rows[0]?.n).toBe(0);
  });

  it('answers in-domain library question with verified citation quote substring', async () => {
    mockRerankAndOllama([
      {
        text: 'Die Jahresgebühr beträgt 120,00 EUR.',
        source: 'S1',
        quote: 'Jahresgebühr: 120,00 EUR',
      },
    ]);
    const threadId = await createLibraryThread();
    const assistant = await threads.appendMessage(threadId, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await service.generate({
      messageId: assistant.id,
      threadId,
      userId,
      userMessage: 'Was kostet die Hundesteuer?',
      documentIds: [],
      scope: 'library',
    });
    expect(result.abstained).toBe(false);
    const rows = await pool.query<{ quote: string; body: string }>(
      `SELECT c.quote, dc.body
       FROM chat_message_citations c
       JOIN document_text_chunks dc ON dc.id = c.chunk_id
       WHERE c.message_id = $1`,
      [assistant.id]
    );
    expect(rows.rows.length).toBeGreaterThanOrEqual(1);
    const row = rows.rows[0];
    expect(row.body.includes(row.quote)).toBe(true);
  });

  it('cites two documents for a multi-part library question', async () => {
    const invoiceChunk = await pool.query<{ id: string; body: string }>(
      `SELECT id, body FROM document_text_chunks WHERE document_id = $1 ORDER BY chunk_index LIMIT 1`,
      [invoiceDocId]
    );
    const taxChunk = await pool.query<{ id: string; body: string }>(
      `SELECT id, body FROM document_text_chunks WHERE document_id = $1 ORDER BY chunk_index LIMIT 1`,
      [taxDocId]
    );
    vi.spyOn(retrieval, 'hybridRetrieveChunks').mockResolvedValue([
      {
        chunkId: invoiceChunk.rows[0].id,
        documentId: invoiceDocId,
        documentTitle: 'Rechnung Nordwind GmbH',
        body: invoiceChunk.rows[0].body,
        page: 1,
        charStart: 0,
        charEnd: invoiceChunk.rows[0].body.length,
        fusionScore: 0.04,
      },
      {
        chunkId: taxChunk.rows[0].id,
        documentId: taxDocId,
        documentTitle: 'Bescheid Hundesteuer',
        body: taxChunk.rows[0].body,
        page: 1,
        charStart: 0,
        charEnd: taxChunk.rows[0].body.length,
        fusionScore: 0.03,
      },
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/v1/rag/retrieve')) {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            passages: Array<{ id: string }>;
          };
          const results = body.passages.map((p, i) => ({
            id: p.id,
            score: 0.9 - i * 0.05,
          }));
          return new Response(
            JSON.stringify({
              results,
              reranker_used: true,
              reranker_model: 'BAAI/bge-reranker-v2-m3-int8',
            }),
            { status: 200 }
          );
        }
        if (url.includes('/api/chat')) {
          const payload = JSON.stringify({
            claims: [
              {
                text: 'Gesamtsumme 1.234,56 EUR',
                source: 'S1',
                quote: 'Gesamtsumme: 1.234,56 EUR',
              },
              {
                text: 'Hundesteuer 120,00 EUR',
                source: 'S2',
                quote: 'Jahresgebühr: 120,00 EUR',
              },
            ],
          });
          const reqBody = JSON.parse(String(init?.body ?? '{}')) as { stream?: boolean };
          if (reqBody.stream) {
            return ollamaStreamResponse(payload);
          }
          return new Response(JSON.stringify({ message: { content: payload } }), { status: 200 });
        }
        throw new Error(`unexpected fetch ${url}`);
      })
    );
    const threadId = await createLibraryThread();
    const assistant = await threads.appendMessage(threadId, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });
    const result = await service.generate({
      messageId: assistant.id,
      threadId,
      userId,
      userMessage: 'Nenne Gesamtsumme der Rechnung Nordwind und die Hundesteuer.',
      documentIds: [],
      scope: 'library',
    });
    expect(result.abstained).toBe(false);
    const rows = await pool.query<{ document_id: string }>(
      `SELECT DISTINCT dc.document_id
       FROM chat_message_citations c
       JOIN document_text_chunks dc ON dc.id = c.chunk_id
       WHERE c.message_id = $1`,
      [assistant.id]
    );
    expect(rows.rows.length).toBeGreaterThanOrEqual(2);
  });
});
