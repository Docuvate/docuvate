// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PgCitedChatRetrievalRepository } from '../../src/modules/cited-chat/infrastructure/pg-cited-chat-retrieval.repository.js';
import { PgDuplicateRepository } from '../../src/modules/duplicates/infrastructure/pg-duplicate.repository.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import { parseNumber, parseString, requireRecord } from '../../src/shared/infrastructure/database/row-parse.js';
import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

/** Exercise RLS policies (superuser test DB otherwise bypasses row security). */
async function withRlsEnforcedPgClient<T>(
  pool: ReturnType<typeof getIntegrationPool>,
  tenantId: string | null,
  run: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE docuvate_rls_enforcer');
    if (tenantId) {
      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantId]);
    }
    const value = await run(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const SHARED_LABEL = 'Rechnung';
const TEXT_A =
  'Rechnung Nordwind GmbH Gesamtsumme 1.234,56 EUR IBAN DE89370400440532013000 marker-tenant-a-only';
const TEXT_B =
  'Rechnung Nordwind GmbH Gesamtsumme 1.234,56 EUR IBAN DE89370400440532013000 marker-tenant-b-only';

function meanVector384(seed: number): { scale: number; bytes: Buffer } {
  const bytes = Buffer.alloc(384);
  for (let i = 0; i < 384; i += 1) {
    bytes.writeInt8(((i + seed) % 127) - 64, i);
  }
  return { scale: 0.01, bytes };
}

async function insertRepresentation(
  pool: ReturnType<typeof getIntegrationPool>,
  tenantId: string,
  documentId: string,
  body: string,
  seed: number
): Promise<void> {
  const mean = meanVector384(seed);
  const unit = meanVector384(seed + 1);
  await withTenantPgClient(pool, tenantId, async (client) => {
    await client.query(
      `INSERT INTO document_representation (
        document_id, tenant_id, encoder_id, encoder_revision, representation_version,
        document_mean_scale, document_mean_int8, document_max_scale, document_max_int8
      ) VALUES ($1,$2,'intfloat/multilingual-e5-small','test-rev',1,$3,$4,$3,$4)`,
      [documentId, tenantId, mean.scale, mean.bytes]
    );
    await client.query(
      `INSERT INTO document_representation_unit (
        document_id, tenant_id, unit_index, kind, body, vector_scale, vector_int8, binary_code
      ) VALUES ($1,$2,0,'paragraph',$3,$4,$5,$6)`,
      [documentId, tenantId, body, unit.scale, unit.bytes, Buffer.alloc(48, seed)]
    );
  });
}

async function insertChunk(
  pool: ReturnType<typeof getIntegrationPool>,
  documentId: string,
  body: string,
  seed: number
): Promise<string> {
  const unit = meanVector384(seed);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO document_text_chunks (
      document_id, chunk_index, body, page, char_start, char_end,
      vector_scale, vector_int8, binary_code, updated_at
    ) VALUES ($1,0,$2,1,0,$3,$4,$5,$6,now()) RETURNING id`,
    [documentId, body, body.length, unit.scale, unit.bytes, Buffer.alloc(48, seed)]
  );
  return parseString(requireRecord(result.rows[0]).id);
}

describe('tenant representation cross-tenant leak (blocking, Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userA: string;
  let userB: string;
  let tagA: string;
  let tagB: string;
  let docA: string;
  let docA2: string;
  let docB: string;

  let searchRepo: PgGlobalSearchRepository;
  let retrievalRepo: PgCitedChatRetrievalRepository;
  let taxonomyRepo: PgTaxonomyRepository;
  let duplicateRepo: PgDuplicateRepository;

  beforeAll(async () => {
    userA = newIsolationUserId();
    userB = newIsolationUserId();
    tagA = randomUUID();
    tagB = randomUUID();
    docA = randomUUID();
    docA2 = randomUUID();
    docB = randomUUID();

    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userA, name: 'Tenant A', email: `${userA}@example.test` });
      await insertSyntheticUser(client, { id: userB, name: 'Tenant B', email: `${userB}@example.test` });
    } finally {
      client.release();
    }

    await pool.query(
      `INSERT INTO tags (id, user_id, name, is_inbox) VALUES ($1,$2,$3,false),($4,$5,$3,false)`,
      [tagA, userA, SHARED_LABEL, tagB, userB]
    );

    for (const [docId, userId, text] of [
      [docA, userA, TEXT_A],
      [docA2, userA, `${TEXT_A} appendix`],
      [docB, userB, TEXT_B],
    ] as const) {
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
         VALUES ($1,$2,'inv.pdf','Invoice','application/pdf',$3,'ready',$4)`,
        [docId, userId, `k/${docId}`, text]
      );
    }

    await insertRepresentation(pool, userA, docA, TEXT_A, 11);
    await insertRepresentation(pool, userA, docA2, `${TEXT_A} appendix`, 12);
    await insertRepresentation(pool, userB, docB, TEXT_B, 21);

    await insertChunk(pool, docA, TEXT_A, 11);
    await insertChunk(pool, docA2, `${TEXT_A} appendix`, 12);
    await insertChunk(pool, docB, TEXT_B, 21);

    await pool.query(
      `INSERT INTO document_tag_suggestions (document_id, tag_id, reason, dismissed, source, confidence)
       VALUES ($1,$2,'semantic',false,'embedding',0.88)`,
      [docA, tagA]
    );
    await pool.query(
      `INSERT INTO document_duplicate_candidates (user_id, document_id, candidate_document_id, similarity, source, dismissed)
       VALUES ($1,$2,$3,0.91,'embedding',false)`,
      [userA, docA, docA2]
    );

    searchRepo = new PgGlobalSearchRepository(pool);
    retrievalRepo = new PgCitedChatRetrievalRepository(pool);
    taxonomyRepo = new PgTaxonomyRepository(pool);
    duplicateRepo = new PgDuplicateRepository(pool);
  }, 120_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userA);
    await deleteSyntheticUser(pool, userB);
    await closeIntegrationPool();
  });

  async function tenantASnapshot() {
    const search = await searchRepo.search(userA, 'marker-tenant-a-only', {
      includeDocuments: true,
      includeFolders: false,
      includeLabels: false,
      perGroupLimit: 10,
    });
    const chat = await retrievalRepo.hybridRetrieveChunks(userA, 'Gesamtsumme Nordwind', {});
    const suggestions = await taxonomyRepo.listSuggestions(docA, userA);
    const duplicates = await duplicateRepo.listForDocument(docA, userA);
    const sqlScoped = await withRlsEnforcedPgClient(pool, userA, async (client) => {
      const rep = await client.query(`SELECT document_id::text FROM document_representation ORDER BY document_id`);
      const units = await client.query(
        `SELECT document_id::text FROM document_representation_unit ORDER BY document_id`
      );
      const chunks = await client.query(
        `SELECT c.id::text FROM document_text_chunks c ORDER BY c.id`
      );
      return {
        representationIds: rep.rows.map((r) => parseString(requireRecord(r).document_id)),
        unitDocIds: units.rows.map((r) => parseString(requireRecord(r).document_id)),
        chunkIds: chunks.rows.map((r) => parseString(requireRecord(r).id)),
      };
    });
    const sqlUnscoped = await withRlsEnforcedPgClient(pool, null, async (client) =>
      client.query(`SELECT COUNT(*)::int AS c FROM document_representation`)
    );
    return {
      searchDocIds: search.documents.map((d) => d.id).sort(),
      chatChunkIds: chat.map((c) => c.chunkId).sort(),
      suggestionTagIds: suggestions.map((s) => s.tag.id).sort(),
      suggestionConfidences: suggestions.map((s) => s.confidence ?? 0),
      duplicateCandidateIds: duplicates.map((d) => d.candidateDocumentId).sort(),
      sqlScoped,
      sqlUnscopedCount: parseNumber(requireRecord(sqlUnscoped.rows[0]).c, 0),
    };
  }

  it('tenant A outputs are unchanged after tenant B data is added or mutated', async () => {
    const before = await tenantASnapshot();
    expect(before.searchDocIds).toContain(docA);
    expect(before.sqlUnscopedCount).toBe(0);

    const docB2 = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text)
       VALUES ($1,$2,'leak.pdf','SECRET-B-LEAK','application/pdf',$3,'ready',$4)`,
      [docB2, userB, `k/${docB2}`, `${TEXT_B} ultra-secret-b-marker`]
    );
    await insertRepresentation(pool, userB, docB2, `${TEXT_B} ultra-secret-b-marker`, 99);
    await insertChunk(pool, docB2, `${TEXT_B} ultra-secret-b-marker`, 99);
    await pool.query(
      `INSERT INTO document_tag_suggestions (document_id, tag_id, reason, dismissed, source, confidence)
       VALUES ($1,$2,'semantic',false,'embedding_density',0.99)`,
      [docB2, tagB]
    );
    await pool.query(
      `INSERT INTO document_duplicate_candidates (user_id, document_id, candidate_document_id, similarity, source, dismissed)
       VALUES ($1,$2,$3,0.99,'embedding',false)`,
      [userB, docB, docB2]
    );

    const leakSearch = await searchRepo.search(userA, 'ultra-secret-b-marker', {
      includeDocuments: true,
      perGroupLimit: 10,
    });
    expect(leakSearch.documents.some((d) => d.id === docB2)).toBe(false);

    const after = await tenantASnapshot();
    expect(after).toEqual(before);
  });

  it('tenant B cannot read tenant A rows via RLS-scoped SQL', async () => {
    const scopedB = await withRlsEnforcedPgClient(pool, userB, async (client) => {
      const reps = await client.query(`SELECT document_id::text FROM document_representation`);
      return reps.rows.map((r) => parseString(requireRecord(r).document_id));
    });
    expect(scopedB).not.toContain(docA);
    expect(scopedB).not.toContain(docA2);
  });
});
