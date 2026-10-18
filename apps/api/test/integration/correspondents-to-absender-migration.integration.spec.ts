// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CorrespondentsToAbsenderField20261018180000 } from '../../src/shared/infrastructure/database/migrations/20261018180000-correspondents-to-absender-field.js';
import { parseString, requireRecord } from '../../src/shared/infrastructure/database/row-parse.js';
import { buildTypeOrmOptions } from '../../src/shared/infrastructure/database/typeorm-options.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('CorrespondentsToAbsenderField migration (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let dataSource: DataSource;
  const migration = new CorrespondentsToAbsenderField20261018180000();

  beforeAll(async () => {
    dataSource = new DataSource(buildTypeOrmOptions());
    await dataSource.initialize();
  }, 120_000);

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await closeIntegrationPool();
  });

  async function tableExists(name: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT to_regclass($1::text) IS NOT NULL AS present`,
      [name]
    );
    const row = requireRecord(result.rows[0]);
    return row.present === true;
  }

  async function runDown(): Promise<void> {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await migration.down(runner);
    } finally {
      await runner.release();
    }
  }

  async function runUp(): Promise<void> {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await migration.up(runner);
    } finally {
      await runner.release();
    }
  }

  it('migrates correspondents to Absender field values and restores on down', async () => {
    const userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Absender migration',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    const hadMigratedSchema = await tableExists('public.saved_document_view_field_filters');
    if (hadMigratedSchema) {
      await runDown();
    }
    expect(await tableExists('public.correspondents')).toBe(true);

    const correspondentId = randomUUID();
    const documentId = randomUUID();
    const viewId = randomUUID();
    await pool.query(
      `INSERT INTO correspondents (id, user_id, name, matching_algorithm, match_text)
       VALUES ($1, $2, 'Acme GmbH', 'none', '')`,
      [correspondentId, userId]
    );
    await pool.query(
      `INSERT INTO documents (
         id, user_id, filename, title, mime_type, storage_key, status, correspondent_id
       ) VALUES ($1, $2, 'a.pdf', 'Invoice', 'application/pdf', 'k/a.pdf', 'ready', $3)`,
      [documentId, userId, correspondentId]
    );
    await pool.query(
      `INSERT INTO saved_document_views (
         id, owner_user_id, name, visibility, search_query, correspondent_id
       ) VALUES ($1, $2, 'Absender view', 'private', '', $3)`,
      [viewId, userId, correspondentId]
    );

    await runUp();

    const absenderRow = await pool.query(
      `SELECT value_text FROM document_field_values
       WHERE document_id = $1 AND field_storage_key = 'global:absender'`,
      [documentId]
    );
    expect(absenderRow.rows[0]).toEqual({ value_text: 'Acme GmbH' });

    const filterRow = await pool.query(
      `SELECT field_key, value_text FROM saved_document_view_field_filters WHERE view_id = $1`,
      [viewId]
    );
    expect(filterRow.rows[0]).toEqual({ field_key: 'absender', value_text: 'Acme GmbH' });

    expect(await tableExists('public.correspondents')).toBe(false);

    await runDown();

    const restored = await pool.query(
      `SELECT name FROM correspondents WHERE user_id = $1 AND name = 'Acme GmbH'`,
      [userId]
    );
    expect(restored.rows.length).toBe(1);

    const docCorr = await pool.query(
      `SELECT c.name
       FROM documents d
       JOIN correspondents c ON c.id = d.correspondent_id
       WHERE d.id = $1`,
      [documentId]
    );
    expect(parseString(requireRecord(docCorr.rows[0]).name)).toBe('Acme GmbH');

    if (hadMigratedSchema) {
      await runUp();
    }

    await deleteSyntheticUser(pool, userId);
  });
});
