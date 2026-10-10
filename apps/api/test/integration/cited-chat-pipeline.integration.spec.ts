// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diversifyLibraryRerank } from '../../src/modules/cited-chat/domain/diversify-reranked-chunks.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { verifyCitedClaims } from '../../src/modules/cited-chat/domain/verify-cited-claims.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

const noopEmbedding: EmbeddingPort = {
  async embedTexts(texts: string[]) {
    return { embeddings: texts.map(() => []), model: 'noop' };
  },
};

/** Same strings as scripts/seed-cited-chat-bench.mjs (normalized chunk bodies). */
const FIXTURE_TEXT: Record<string, { title: string; text: string }> = {
  rechnung: {
    title: 'Rechnung Nordwind GmbH',
    text: 'Rechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000',
  },
  miete: {
    title: 'Mietvertrag Wohnung',
    text: 'Mietvertrag Wohnung\nDie Miete ist bis zum 3. Werktag des Monats fällig.',
  },
  kuendigung: {
    title: 'Arbeitsvertrag',
    text: 'Arbeitsvertrag\nDie Kündigungsfrist beträgt drei Monate zum Quartalsende.',
  },
  hund: {
    title: 'Bescheid Hundesteuer',
    text: 'Bescheid Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR',
  },
};

describe('cited chat pipeline (seed fixtures, Testcontainers)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let retrieval: PgCitedChatRetrievalRepository;
  const docIds: Record<string, string> = {};

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'Pipeline', email: `${userId}@example.test` });
    } finally {
      client.release();
    }

    const searchRepo = new PgGlobalSearchRepository(pool);
    retrieval = new PgCitedChatRetrievalRepository(pool);

    for (const [key, fixture] of Object.entries(FIXTURE_TEXT)) {
      const docId = randomUUID();
      docIds[key] = docId;
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
         VALUES ($1,$2,$3,$4,'application/pdf',$5,'ready',$6)`,
        [docId, userId, `${key}.pdf`, fixture.title, `k/${key}`, fixture.text.replace(/\n/g, ' ')]
      );
      await searchRepo.indexDocumentChunks(
        userId,
        docId,
        splitTextChunksWithSpans(fixture.text.replace(/\n/g, ' '))
      );
    }
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  async function buildTopAndPool(question: string) {
    const candidates = await retrieval.hybridRetrieveChunks(userId, question, {});
    const ranked = candidates
      .slice()
      .sort((a, b) => b.fusionScore - a.fusionScore)
      .map((chunk) => ({ chunk, score: chunk.fusionScore }));
    const top = diversifyLibraryRerank(ranked, 4);
    const labelByChunk = new Map<string, string>();
    top.forEach((row, i) => {
      labelByChunk.set(row.chunk.chunkId, `S${i + 1}`);
    });
    const chunkPool = candidates.map((chunk) => ({ chunk }));
    return { top, labelByChunk, chunkPool };
  }

  it('verifies Miete and Kündigung quotes against indexed seed chunks', async () => {
    const miete = await buildTopAndPool('Bis wann ist die Miete fällig?');
    const mieteLabel = miete.top.find((row) =>
      row.chunk.body.includes('Werktag')
    );
    expect(mieteLabel).toBeDefined();
    const mieteSource = miete.labelByChunk.get(mieteLabel!.chunk.chunkId) ?? 'S1';
    const mieteRelabeled = verifyCitedClaims({
      claims: [
        {
          text: 'Die Miete ist bis zum 3. Werktag fällig.',
          source: mieteSource,
          quote: 'bis zum 3. Werktag',
        },
      ],
      top: miete.top,
      labelByChunk: miete.labelByChunk,
      chunkPool: miete.chunkPool,
    });
    expect(mieteRelabeled.rejected).toHaveLength(0);
    expect(mieteRelabeled.verified.length).toBeGreaterThan(0);

    const kuend = await buildTopAndPool('Welche Kündigungsfrist gilt im Vertrag?');
    const kuendChunk = kuend.top.find((row) => row.chunk.body.includes('Kündigungsfrist'));
    expect(kuendChunk).toBeDefined();
    const kuendSource = kuend.labelByChunk.get(kuendChunk!.chunk.chunkId)!;
    const kuendVerify = verifyCitedClaims({
      claims: [
        {
          text: 'Die Kündigungsfrist beträgt drei Monate zum Quartalsende.',
          source: kuendSource,
          quote: 'drei Monate zum Quartalsende',
        },
      ],
      top: kuend.top,
      labelByChunk: kuend.labelByChunk,
      chunkPool: kuend.chunkPool,
    });
    expect(kuendVerify.rejected).toHaveLength(0);
  });

  it('resolves IBAN quote via chunk pool when rerank top omits IBAN span', async () => {
    const iban = await buildTopAndPool('Welche IBAN hat der Absender?');
    const labeled = iban.top.find((row) => row.chunk.documentTitle.includes('Nordwind'));
    expect(labeled).toBeDefined();
    const source = iban.labelByChunk.get(labeled!.chunk.chunkId)!;
    const result = verifyCitedClaims({
      claims: [
        {
          text: 'Die IBAN ist DE89370400440532013000.',
          source,
          quote: 'IBAN DE89370400440532013000',
        },
      ],
      top: iban.top,
      labelByChunk: iban.labelByChunk,
      chunkPool: iban.chunkPool,
    });
    expect(result.rejected).toHaveLength(0);
    expect(result.verified[0]?.quote).toContain('IBAN');
  });
});
