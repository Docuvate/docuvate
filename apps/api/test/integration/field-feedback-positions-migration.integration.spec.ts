// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { canonicalFieldName } from '@docuvate/contracts';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ExtractionFieldFeedbackPositions20261104120000 } from '../../src/shared/infrastructure/database/migrations/20261104120000-extraction-field-feedback-positions.js';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const STORED_KEYS = [
  'suggestion:absender',
  'global:Absender',
  'label:0b6b1d1e-8a4f-4c3e-9d2a-5b7c8e9f0a1b:rechnungs_nummer',
  'Kunden-Nummer',
];

describe('ExtractionFieldFeedbackPositions migration (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const migration = new ExtractionFieldFeedbackPositions20261104120000();
  let dataSource: DataSource;
  let userId: string;

  async function run(step: 'up' | 'down'): Promise<void> {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await (step === 'up' ? migration.up(runner) : migration.down(runner));
    } finally {
      await runner.release();
    }
  }

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'M', email: `${userId}@example.test` });
    } finally {
      client.release();
    }
  }, 120_000);

  afterAll(async () => {
    await run('up');
    await deleteSyntheticUser(pool, userId);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await closeIntegrationPool();
  });

  it('backfills canonical field names like the TS normalizer and reverses without data loss', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'm.pdf', 'application/pdf', 'k', 'ready')`,
      [documentId, userId]
    );
    await run('down');
    for (const key of STORED_KEYS) {
      await pool.query(
        `INSERT INTO extraction_field_corrections (user_id, document_id, field_key, old_value, new_value)
         VALUES ($1, $2, $3, 'a', 'b')`,
        [userId, documentId, key]
      );
    }
    await pool.query(
      `INSERT INTO extraction_field_confirmations (user_id, document_id, field_key)
       VALUES ($1, $2, 'global:absender')`,
      [userId, documentId]
    );

    await run('up');
    await run('up');

    const rows = await pool.query<{ field_key: string; name: string }>(
      `SELECT c.field_key, n.name FROM extraction_field_corrections c
       JOIN extraction_field_names n ON n.id = c.field_name_id
       WHERE c.user_id = $1 ORDER BY c.field_key`,
      [userId]
    );
    expect(rows.rows).toHaveLength(STORED_KEYS.length);
    for (const row of rows.rows) {
      expect(row.name).toBe(canonicalFieldName(row.field_key));
    }
    const confirmed = await pool.query<{ name: string }>(
      `SELECT n.name FROM extraction_field_confirmations c
       JOIN extraction_field_names n ON n.id = c.field_name_id WHERE c.user_id = $1`,
      [userId]
    );
    expect(confirmed.rows[0]?.name).toBe(canonicalFieldName('global:absender'));

    await pool.query(
      `UPDATE extraction_field_confirmations SET value_text = 'Nordwind GmbH' WHERE user_id = $1`,
      [userId]
    );
    await run('down');
    const hashed = await pool.query<{ ok: boolean }>(
      `SELECT value_sha256 = digest(convert_to('Nordwind GmbH', 'UTF8'), 'sha256') AS ok
       FROM extraction_field_confirmations WHERE user_id = $1`,
      [userId]
    );
    expect(hashed.rows[0]?.ok).toBe(true);
    const kept = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM extraction_field_corrections WHERE user_id = $1`,
      [userId]
    );
    expect(kept.rows[0]?.c).toBe(STORED_KEYS.length);
  });
});
