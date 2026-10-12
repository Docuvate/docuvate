// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { withTenantPgClient } from '../../src/shared/infrastructure/database/tenant-pg.js';
import { createPgTestPool, truncateTenantTables } from './pg-test-isolation.js';

describe('document representation RLS (Testcontainers Postgres)', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = await createPgTestPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('returns zero rows without app.tenant_id', async () => {
    await truncateTenantTables(pool);
    const result = await pool.query(`SELECT COUNT(*)::int AS c FROM document_representation`);
    expect(result.rows[0]?.c).toBe(0);
  });

  it('allows tenant-scoped reads after set_config', async () => {
    await truncateTenantTables(pool);
    const userId = 'rls-user-1';
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, 't', 't@example.com', true, now(), now())`,
      [userId]
    );
    const docId = '00000000-0000-4000-8000-000000000001';
    await pool.query(
      `INSERT INTO documents (id, user_id, title, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 't', 't.pdf', 'application/pdf', 'k', 'ready')`,
      [docId, userId]
    );
    await withTenantPgClient(pool, userId, async (client) => {
      await client.query(
        `INSERT INTO document_representation (
          document_id, tenant_id, encoder_id, encoder_revision, representation_version,
          document_mean_scale, document_mean_int8, document_max_scale, document_max_int8
        ) VALUES ($1,$2,'intfloat/multilingual-e5-small','rev',1,1.0,'\\x00'::bytea,1.0,'\\x00'::bytea)`,
        [docId, userId]
      );
      const count = await client.query(`SELECT COUNT(*)::int AS c FROM document_representation`);
      expect(count.rows[0]?.c).toBe(1);
    });
    const blocked = await pool.query(`SELECT COUNT(*)::int AS c FROM document_representation`);
    expect(blocked.rows[0]?.c).toBe(0);
  });
});
