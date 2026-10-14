// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PgEncoderReindexRepository } from '../../src/modules/representation/infrastructure/pg-encoder-reindex.repository.js';
import {
  DOCUMENT_ENCODER_ID,
  DOCUMENT_ENCODER_REVISION,
} from '../../src/shared/domain/document-encoder.js';
import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

describe('encoder reindex repository (tenant isolation)', () => {
  const pool = getIntegrationPool();
  let tenantA: string;
  let tenantB: string;
  let repo: PgEncoderReindexRepository;

  beforeAll(async () => {
    tenantA = newIsolationUserId();
    tenantB = newIsolationUserId();
    repo = new PgEncoderReindexRepository(pool);
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: tenantA,
        name: 'Tenant A',
        email: `${tenantA}@example.test`,
      });
      await insertSyntheticUser(client, {
        id: tenantB,
        name: 'Tenant B',
        email: `${tenantB}@example.test`,
      });
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    await deleteSyntheticUser(pool, tenantA);
    await deleteSyntheticUser(pool, tenantB);
    await closeIntegrationPool();
  });

  it('returns zero stale rows for tenant B when only tenant A has stale embeddings', async () => {
    const docA = randomUUID();
    const docB = randomUUID();
    await withTenantPgClient(pool, tenantA, async (client) => {
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
         VALUES ($1,$2,'a.pdf','a','application/pdf','k/a', 'ready', 'Tenant A stale encoder reindex marker text long enough')`,
        [docA, tenantA]
      );
      await client.query(
        `INSERT INTO document_representation (
          document_id, tenant_id, encoder_id, encoder_revision, representation_version,
          document_mean_scale, document_mean_int8, document_max_scale, document_max_int8
        ) VALUES ($1,$2,'legacy-model','legacy-rev',1,0.01,$3,0.01,$3)`,
        [docA, tenantA, Buffer.alloc(384, 1)]
      );
    });
    await withTenantPgClient(pool, tenantB, async (client) => {
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
         VALUES ($1,$2,'b.pdf','b','application/pdf','k/b', 'ready', 'Tenant B current encoder marker text long enough')`,
        [docB, tenantB]
      );
      await client.query(
        `INSERT INTO document_representation (
          document_id, tenant_id, encoder_id, encoder_revision, representation_version,
          document_mean_scale, document_mean_int8, document_max_scale, document_max_int8
        ) VALUES ($1,$2,$3,$4,1,0.01,$5,0.01,$5)`,
        [docB, tenantB, DOCUMENT_ENCODER_ID, DOCUMENT_ENCODER_REVISION, Buffer.alloc(384, 2)]
      );
    });

    const staleForB = await repo.listStaleDocumentIdsForTenant(tenantB, 10);
    expect(staleForB).toEqual([]);

    const progressB = await repo.progressForTenant(tenantB);
    expect(progressB.staleCount).toBe(0);

    const staleForA = await repo.listStaleDocumentIdsForTenant(tenantA, 10);
    expect(staleForA).toContain(docA);
  });
});
