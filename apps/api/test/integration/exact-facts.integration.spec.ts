import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PersistDocumentFactsUseCase } from '../../src/modules/exact-facts/application/persist-document-facts.use-case.js';
import { PgDocumentExtractedFactRepository } from '../../src/modules/exact-facts/infrastructure/pg-document-extracted-fact.repository.js';
import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('exact fact index (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const repository = new PgDocumentExtractedFactRepository(pool);
  const persist = new PersistDocumentFactsUseCase(repository);
  let userA: string;
  let userB: string;
  let documentA: string;

  beforeAll(async () => {
    userA = newIsolationUserId();
    userB = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userA, name: 'A', email: `${userA}@example.test` });
      await insertSyntheticUser(client, { id: userB, name: 'B', email: `${userB}@example.test` });
      documentA = randomUUID();
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status)
         VALUES ($1, $2, 'fact.pdf', 'Fact doc', 'application/pdf', $3, 'ready')`,
        [documentA, userA, `storage/${documentA}`]
      );
    } finally {
      client.release();
    }
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userA);
    await deleteSyntheticUser(pool, userB);
    await closeIntegrationPool();
  });

  it('stores facts with provenance for tenant A only', async () => {
    await persist.execute(userA, documentA, [
      {
        kind: 'key_value',
        predicateKey: 'kündigungsfrist',
        confidence: 0.8,
        provenance: {
          page: 1,
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.04,
          charStart: 10,
          charEnd: 40,
        },
        valueText: '3 Monate',
      },
    ], 1.5);

    const rowsA = await withTenantPgClient(pool, userA, async (client) => {
      const result = await client.query<{ predicate_key: string; char_start: number | null }>(
        `SELECT f.predicate_key, p.char_start
         FROM document_extracted_fact f
         INNER JOIN document_extracted_fact_provenance p ON p.fact_id = f.id
         WHERE f.document_id = $1`,
        [documentA]
      );
      return result.rows;
    });
    expect(rowsA).toHaveLength(1);
    expect(rowsA[0]?.predicate_key).toBe('kündigungsfrist');
    expect(rowsA[0]?.char_start).toBe(10);

    const rowsB = await withTenantPgClient(pool, userB, async (client) => {
      const result = await client.query<{ id: string }>(
        `SELECT id FROM document_extracted_fact WHERE document_id = $1`,
        [documentA]
      );
      return result.rows;
    });
    expect(rowsB).toEqual([]);
  });
});
