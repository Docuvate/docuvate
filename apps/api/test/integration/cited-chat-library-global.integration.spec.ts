// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const EMBED_DIM = 384;
/** More than the old dense∩lexical gate threshold (64 vectorized chunks). */
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

describe('cited chat library global retrieval (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let answerDocId: string;
  let retrieval: PgCitedChatRetrievalRepository;

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
    const decoyDocId = randomUUID();
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

    retrieval = new PgCitedChatRetrievalRepository(pool);
  }, 120_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('indexes a document and answers a library-global question via dense hybrid retrieval', async () => {
    const question = 'semantische paraphrase fahrzeugversicherung jahreskosten';
    const candidates = await retrieval.hybridRetrieveChunks(userId, question, {
      queryVector: queryVector384(17),
    });
    expect(candidates.length).toBeGreaterThan(0);
    const hit = candidates.find((c) => c.documentId === answerDocId);
    expect(hit).toBeDefined();
    expect(hit?.body).toContain('312,40 EUR');
  });
});
