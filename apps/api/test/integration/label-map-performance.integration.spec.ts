// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BackfillDocumentEmbeddingsUseCase } from '../../src/modules/labels/application/backfill-document-embeddings.use-case.js';
import { EnrichLabelMapMissingHintsUseCase } from '../../src/modules/labels/application/enrich-label-map-missing-hints.use-case.js';
import { GetLabelMapUseCase } from '../../src/modules/labels/application/get-label-map.use-case.js';
import { PgLabelEmbeddingRepository } from '../../src/modules/labels/infrastructure/pg-label-embedding.repository.js';
import type { MissingLabelHintPort } from '../../src/modules/labels/domain/ce-label-propagation.port.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import { EnsureDocumentRepresentationUseCase } from '../../src/modules/representation/application/ensure-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from '../../src/modules/representation/infrastructure/pg-document-representation.repository.js';
import { PgUserPreferencesRepository } from '../../src/modules/settings/infrastructure/pg-user-preferences.repository.js';
import { createDocumentRepositoryStub } from '../../src/test-support/document-repository.stub.js';
import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const DOCUMENT_COUNT = 900;
const TAG_COUNT = 12;

describe('GET /labels/map scale (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  const tagIds: string[] = [];

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'MapPerf',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }
    for (let index = 0; index < TAG_COUNT; index += 1) {
      const tagId = randomUUID();
      tagIds.push(tagId);
      await pool.query(`INSERT INTO tags (id, user_id, name) VALUES ($1, $2, $3)`, [
        tagId,
        userId,
        `Label-${index}`,
      ]);
    }

    const text =
      'Vertrauliche Vereinbarung zwischen den Parteien über Leistungen und Vergütung im Geschäftsjahr.';
    const scale = 0.01;
    const meanBytes = Buffer.alloc(64);
    for (let i = 0; i < meanBytes.length; i += 1) {
      meanBytes.writeInt8(i, i % 127);
    }

    await withTenantPgClient(pool, userId, async (client) => {
      for (let batchStart = 0; batchStart < DOCUMENT_COUNT; batchStart += 100) {
        const batchEnd = Math.min(DOCUMENT_COUNT, batchStart + 100);
        for (let docIndex = batchStart; docIndex < batchEnd; docIndex += 1) {
          const documentId = randomUUID();
          await client.query(
            `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status, extracted_text, title)
             VALUES ($1, $2, $3, 'application/pdf', $4, 'ready', $5, $6)`,
            [
              documentId,
              userId,
              `doc-${docIndex}.pdf`,
              `users/${userId}/${documentId}/source`,
              text,
              `Title ${docIndex}`,
            ]
          );
          await client.query(
            `INSERT INTO document_representation (document_id, document_mean_scale, document_mean_int8)
             VALUES ($1, $2, $3)`,
            [documentId, scale, meanBytes]
          );
          await client.query(`INSERT INTO document_embeddings (document_id, model, embedding) VALUES ($1, 'e5', NULL)`, [
            documentId,
          ]);
          const tagId = tagIds[docIndex % TAG_COUNT];
          await client.query(
            `INSERT INTO document_tags (document_id, tag_id, user_confirmed) VALUES ($1, $2, true)`,
            [documentId, tagId]
          );
        }
      }
    });
  }, 180_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('builds label map under 500ms at ~900 documents', async () => {
    const representationRepo = new PgDocumentRepresentationRepository(pool);
    const ensureRepresentation = new EnsureDocumentRepresentationUseCase(representationRepo);
    const labelEmbeddings = new PgLabelEmbeddingRepository(
      pool,
      representationRepo,
      ensureRepresentation
    );
    const taxonomy = new PgTaxonomyRepository(pool);
    const prefs = new PgUserPreferencesRepository(pool);
    class RefreshEmbeddingsStub {
      async execute(): Promise<number> {
        return 0;
      }
    }
    const backfill = new BackfillDocumentEmbeddingsUseCase(
      labelEmbeddings,
      new RefreshEmbeddingsStub()
    );
    const hintPort: MissingLabelHintPort = {
      scoreMissingLabelHint: async () => ({ score: 0, show: false }),
      scoreMissingLabelHintsBatch: async () => [],
    };
    const enrich = new EnrichLabelMapMissingHintsUseCase(
      createDocumentRepositoryStub(),
      hintPort
    );
    const useCase = new GetLabelMapUseCase(
      labelEmbeddings,
      taxonomy,
      prefs,
      backfill,
      enrich
    );

    const started = performance.now();
    const map = await useCase.execute(userId);
    const elapsedMs = performance.now() - started;

    expect(map.documentCount).toBe(DOCUMENT_COUNT);
    expect(map.points.length).toBeGreaterThan(DOCUMENT_COUNT);
    expect(elapsedMs).toBeLessThan(500);
  });
});
