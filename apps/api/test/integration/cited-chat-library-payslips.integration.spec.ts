// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
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

describe('cited chat library payslip corpus (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let octoberDocId: string;
  let retrieval: PgCitedChatRetrievalRepository;

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

    for (let index = 0; index < PAYSLIP_COUNT; index += 1) {
      const month = (index % 12) + 1;
      const year = 2024 - Math.floor(index / 12);
      const isTargetOctober2024 = year === 2024 && month === 10;
      const docId = isTargetOctober2024 ? octoberDocId : randomUUID();
      const monthPadded = String(month).padStart(2, '0');
      const gross = isTargetOctober2024 ? OCTOBER_GROSS : `${String(4000 + month)},00`;
      const body = `Entgeltnachweis ${monthPadded}/${String(year)}\nGesamtbrutto ${gross} EUR\nNettoentgelt ${String(3000 + month)},00 EUR`;
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, document_date)
         VALUES ($1,$2,$3,$4,'application/pdf',$5,'ready',$6,$7)`,
        [
          docId,
          userId,
          isTargetOctober2024
            ? `Entgeltnachweis ${String(year)}_${monthPadded}.pdf`
            : `${String(year)}_${monthPadded}.pdf`,
          `Entgeltnachweis ${monthPadded}/${String(year)}`,
          `k/payslip-${String(year)}-${monthPadded}-${String(index)}`,
          body,
          `${String(year)}-${monthPadded}-28`,
        ]
      );
      const chunks = splitTextChunksWithSpans(body);
      const vectors = chunks.map((_, chunkIndex) => int8Vector384(index * 10 + chunkIndex));
      await searchRepo.indexDocumentChunks(userId, docId, chunks, undefined, {
        int8Vectors: vectors,
      });
    }

    retrieval = new PgCitedChatRetrievalRepository(pool);
  }, 180_000);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('supplements retrieval with the October 2024 payslip among ~57 documents', async () => {
    const question =
      'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?';
    const temporal = await retrieval.supplementTemporalLibraryCandidates(userId, question);
    expect(temporal.some((row) => row.documentId === octoberDocId)).toBe(true);
    expect(temporal.some((row) => row.body.includes(OCTOBER_GROSS))).toBe(true);
  });

  it('hybrid retrieval includes October payslip after temporal supplement in a large library', async () => {
    const question =
      'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?';
    const hybrid = await retrieval.hybridRetrieveChunks(userId, question, {
      queryVector: queryVector384(42),
    });
    const temporal = await retrieval.supplementTemporalLibraryCandidates(userId, question);
    const mergedIds = new Set([
      ...hybrid.map((row) => row.documentId),
      ...temporal.map((row) => row.documentId),
    ]);
    expect(mergedIds.has(octoberDocId)).toBe(true);
    const bodies = [...hybrid, ...temporal].map((row) => row.body).join('\n');
    expect(bodies).toContain(OCTOBER_GROSS);
  });
});
