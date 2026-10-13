import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CitedChatGenerationService } from '../../src/modules/cited-chat/application/cited-chat-generation.service.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgChatMessageCitationsRepository } from '../../src/modules/cited-chat/infrastructure/pg-chat-message-citations.repository.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgDocumentChatThreadRepository } from '../../src/modules/documents/infrastructure/pg-document-chat-thread.repository.js';
import { ExactFactQueryRouterService } from '../../src/modules/exact-facts/application/exact-fact-query-router.service.js';
import { PersistDocumentFactsUseCase } from '../../src/modules/exact-facts/application/persist-document-facts.use-case.js';
import { TryExactFactChatAnswerUseCase } from '../../src/modules/exact-facts/application/try-exact-fact-chat-answer.use-case.js';
import { PgDocumentExtractedFactRepository } from '../../src/modules/exact-facts/infrastructure/pg-document-extracted-fact.repository.js';
import { EXACT_FACT_ABSTENTION_DE } from '../../src/modules/exact-facts/domain/exact-fact-abstention-messages.js';
import { PgExactFactQueryRepository } from '../../src/modules/exact-facts/infrastructure/pg-exact-fact-query.repository.js';
import { PgTenantExactFactChatSettingsRepository } from '../../src/modules/exact-facts/infrastructure/pg-tenant-exact-fact-chat-settings.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import { disabledExactFactChatDeps } from '../helpers/disabled-exact-fact-chat-deps.js';
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

describe('exact fact chat (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let documentId: string;
  let threads: PgDocumentChatThreadRepository;
  let generation: CitedChatGenerationService;

  beforeAll(async () => {
    userId = newIsolationUserId();
    documentId = randomUUID();
    const extractedText = 'Jahresabschluss\nReingewinn 2025: 12.345,67 EUR\n';
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Exact',
        email: `${userId}@example.test`,
      });
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
         VALUES ($1, $2, 'ja.pdf', 'Jahresabschluss', 'application/pdf', $3, 'ready', $4)`,
        [documentId, userId, `storage/${documentId}`, extractedText]
      );
    } finally {
      client.release();
    }

    const factRepo = new PgDocumentExtractedFactRepository(pool);
    const persist = new PersistDocumentFactsUseCase(factRepo);
    await persist.execute(
      userId,
      documentId,
      [
        {
          kind: 'amount',
          predicateKey: 'reingewinn 2025',
          confidence: 0.9,
          provenance: {
            page: 1,
            x: 0.1,
            y: 0.2,
            width: 0.5,
            height: 0.04,
            charStart: 17,
            charEnd: 45,
          },
          amountNumeric: 12345.67,
          currencyCode: 'EUR',
        },
      ],
      1
    );

    await new PgGlobalSearchRepository(pool).indexDocumentChunks(
      userId,
      documentId,
      splitTextChunksWithSpans(extractedText)
    );

    threads = new PgDocumentChatThreadRepository(pool);
    const exactFactDeps = disabledExactFactChatDeps({
      layoutReconstructionCompare: false,
      sourceConnectors: false,
      experimentalResearchModels: false,
      exactAnswers: true,
      answerAbstention: true,
    });
    const factQuery = new PgExactFactQueryRepository(pool);
    const chatSettings = new PgTenantExactFactChatSettingsRepository(pool);
    generation = new CitedChatGenerationService(
      threads,
      noopEmbedding,
      new PgCitedChatRetrievalRepository(pool),
      new PgChatMessageCitationsRepository(pool),
      passthroughChatQueryRouter(),
      exactFactDeps.resolveFeatureFlags,
      new ExactFactQueryRouterService(),
      new TryExactFactChatAnswerUseCase(factQuery, chatSettings)
    );
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('answers lookup from fact index with citations', async () => {
    const thread = await threads.createThread(userId, [documentId], { scope: 'document' });
    await threads.appendMessage(thread.id, 'user', 'Reingewinn 2025');
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });

    const result = await generation.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: 'Reingewinn 2025',
      documentIds: [documentId],
      scope: 'document',
      locale: 'de',
    });

    expect(result.abstained).toBe(false);
    expect(result.content).toContain('12.345,67');
    expect(result.content).toContain('[1]');

    const citations = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM chat_message_citations WHERE message_id = $1`,
      [assistant.id]
    );
    expect(citations.rows[0]?.count).toBe('1');
  });

  it('abstains on decoy predicate overlap when answerAbstention is enabled', async () => {
    const thread = await threads.createThread(userId, [documentId], { scope: 'document' });
    await threads.appendMessage(thread.id, 'user', 'Gewinn 2025');
    const assistant = await threads.appendMessage(thread.id, 'assistant', '', {
      generationStatus: 'pending',
      generationPhase: 'retrieving',
    });

    const result = await generation.generate({
      messageId: assistant.id,
      threadId: thread.id,
      userId,
      userMessage: 'Gewinn 2025',
      documentIds: [documentId],
      scope: 'document',
      locale: 'de',
    });

    expect(result.abstained).toBe(true);
    expect(result.content).toBe(EXACT_FACT_ABSTENTION_DE);
  });
});
