// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import type { LabelMapResponseDto } from '@docuvate/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BackfillDocumentEmbeddingsUseCase } from '../../src/modules/labels/application/backfill-document-embeddings.use-case.js';
import { EnrichLabelMapMissingHintsUseCase } from '../../src/modules/labels/application/enrich-label-map-missing-hints.use-case.js';
import { GetLabelMapUseCase } from '../../src/modules/labels/application/get-label-map.use-case.js';
import type { MissingLabelHintPort } from '../../src/modules/labels/domain/ce-label-propagation.port.js';
import { PgLabelEmbeddingRepository } from '../../src/modules/labels/infrastructure/pg-label-embedding.repository.js';
import { WorkerExtractCapacityCoordinator } from '../../src/modules/extraction/infrastructure/worker-extract-capacity.coordinator.js';
import { EnsureDocumentRepresentationUseCase } from '../../src/modules/representation/application/ensure-document-representation.use-case.js';
import { PersistDocumentRepresentationUseCase } from '../../src/modules/representation/application/persist-document-representation.use-case.js';
import { PgDocumentRepresentationRepository } from '../../src/modules/representation/infrastructure/pg-document-representation.repository.js';
import { PgUserPreferencesRepository } from '../../src/modules/settings/infrastructure/pg-user-preferences.repository.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { createDocumentRepositoryStub } from '../../src/test-support/document-repository.stub.js';
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
        `Label-${String(index)}`,
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
              `doc-${String(docIndex)}.pdf`,
              `users/${userId}/${documentId}/source`,
              text,
              `Title ${String(docIndex)}`,
            ]
          );
          await client.query(
            `INSERT INTO document_representation (
              document_id, tenant_id, encoder_id, encoder_revision, representation_version,
              document_mean_scale, document_mean_int8, document_max_scale, document_max_int8
            ) VALUES ($1, $2, 'intfloat/multilingual-e5-small', 'rev', 1, $3, $4, $3, $4)`,
            [documentId, userId, scale, meanBytes]
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
    const persistRepresentation = new PersistDocumentRepresentationUseCase(representationRepo);
    const extractCapacity = new WorkerExtractCapacityCoordinator();
    const ensureRepresentation = new EnsureDocumentRepresentationUseCase(
      representationRepo,
      persistRepresentation,
      extractCapacity
    );
    const labelEmbeddings = new PgLabelEmbeddingRepository(
      pool,
      representationRepo,
      ensureRepresentation
    );
    const taxonomy = new PgTaxonomyRepository(pool);
    const prefs = new PgUserPreferencesRepository(pool);
    class RefreshEmbeddingsStub {
      execute(): Promise<void> {
        return Promise.resolve();
      }
    }
    const backfill = new BackfillDocumentEmbeddingsUseCase(
      labelEmbeddings,
      new RefreshEmbeddingsStub()
    );
    const hintPort: MissingLabelHintPort = {
      scoreMissingLabelHint: () => Promise.resolve({ score: 0, show: false }),
      scoreMissingLabelHintsBatch: () => Promise.resolve([]),
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
    const map: LabelMapResponseDto = await useCase.execute(userId);
    const elapsedMs = performance.now() - started;
    console.info(
      `label-map perf: ${elapsedMs.toFixed(1)}ms for ${String(DOCUMENT_COUNT)} documents`
    );

    expect(map.documentCount).toBe(DOCUMENT_COUNT);
    expect(map.points.length).toBeGreaterThanOrEqual(DOCUMENT_COUNT);
    expect(elapsedMs).toBeLessThan(500);
  });
});
