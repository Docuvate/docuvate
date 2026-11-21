// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { replaceDocumentFieldValues } from '../../src/modules/search/infrastructure/document-field-value-index.js';
import { getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('document list q matches structured field amounts', () => {
  const pool = getIntegrationPool();
  const repo = new PgDocumentRepository(pool);
  let userId: string;
  let amountDocId: string;

  beforeEach(async () => {
    userId = newIsolationUserId();
    amountDocId = randomUUID();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
      await client.query(
        `INSERT INTO recognized_field_definitions
         (id, user_id, field_key, label, field_type, sort_order, extract_for_all_documents)
         VALUES ($1,$2,'betrag','Betrag','currency',0,true)
         ON CONFLICT DO NOTHING`,
        [randomUUID(), userId]
      );
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, extracted_text, updated_at, created_at)
         VALUES ($1, $2, 'amount.pdf', 'Field amount only', 'ready', $3, 'application/pdf', 'no digits here', now(), now())`,
        [amountDocId, userId, `storage/${amountDocId}`]
      );
    } finally {
      client.release();
    }
    await replaceDocumentFieldValues(pool, amountDocId, userId, [
      { key: 'global:betrag', value: '1.234,56' },
    ]);
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, userId);
  });

  it('lists the document for digit-prefix q=1234 via field value', async () => {
    const listed = await repo.listForUser(userId, { q: '1234' });
    expect(listed.map((d) => d.id)).toContain(amountDocId);
  });

  it('lists the document for exact German amount q=1.234,56 via field value', async () => {
    const listed = await repo.listForUser(userId, { q: '1.234,56' });
    expect(listed.map((d) => d.id)).toContain(amountDocId);
  });
});
