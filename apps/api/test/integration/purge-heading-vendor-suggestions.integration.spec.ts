import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const purgeHeadingVendorSql = readFileSync(
  join(
    __dirname,
    '../../src/shared/infrastructure/database/migrations/sql/purge-heading-vendor-suggestions-up.sql'
  ),
  'utf8'
);

function layoutIrWithHeading(headingText: string) {
  return {
    version: 1,
    pages: [
      {
        page: 1,
        widthPt: 595,
        heightPt: 842,
        blocks: [
          {
            page: 1,
            x: 0.1,
            y: 0.05,
            width: 0.8,
            height: 0.04,
            text: headingText,
            weight: 'bold',
            align: 'left',
            fontSizePt: 15,
          },
        ],
        lines: [],
        tables: [],
        vectors: [],
        widgets: [],
      },
    ],
  };
}

describe('purge heading vendor suggestions migration (integration)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  const headingDocId = randomUUID();
  const senderDocIds = [randomUUID(), randomUUID(), randomUUID()];
  const headingTitle = 'Synthetic Section Title For Purge Test';
  const realSenders = [
    'STADTWERKE KÖLN',
    'FINANZAMT DARMSTADT',
    'Deutsche Rentenversicherung Knappschaft Bahn See Bochum',
  ];

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'P', email: `${userId}@example.test` });
    } finally {
      client.release();
    }

    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'purge-heading.pdf', 'application/pdf', 'k1', 'ready')`,
      [headingDocId, userId]
    );
    await pool.query(
      `INSERT INTO document_layout_ir (document_id, version, ir)
       VALUES ($1, 1, $2::jsonb)`,
      [headingDocId, JSON.stringify(layoutIrWithHeading(headingTitle))]
    );
    await pool.query(
      `INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
       VALUES ($1, 'suggestion:vendor', $2, 0.42),
              ($1, 'vendor', $2, 0.95),
              ($1, 'global:vendor', $2, 0.95)`,
      [headingDocId, headingTitle]
    );

    for (let i = 0; i < realSenders.length; i += 1) {
      const docId = senderDocIds[i];
      const sender = realSenders[i];
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
         VALUES ($1, $2, $3, 'application/pdf', $4, 'ready')`,
        [docId, userId, `sender-${i}.pdf`, `k${i + 2}`]
      );
      await pool.query(
        `INSERT INTO document_layout_ir (document_id, version, ir)
         VALUES ($1, 1, $2::jsonb)`,
        [docId, JSON.stringify(layoutIrWithHeading('Unrelated body heading'))]
      );
      await pool.query(
        `INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
         VALUES ($1, 'suggestion:vendor', $2, 0.42)`,
        [docId, sender]
      );
    }
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('drops only suggestion:vendor rows that match a heading block; keeps real senders and confirmed vendor keys', async () => {
    await pool.query(purgeHeadingVendorSql);

    const headingRows = await pool.query<{ field_storage_key: string; value_text: string }>(
      `SELECT field_storage_key, value_text
       FROM document_field_values
       WHERE document_id = $1
       ORDER BY field_storage_key`,
      [headingDocId]
    );
    expect(headingRows.rows).toEqual([
      { field_storage_key: 'global:vendor', value_text: headingTitle },
      { field_storage_key: 'vendor', value_text: headingTitle },
    ]);

    for (let i = 0; i < realSenders.length; i += 1) {
      const rows = await pool.query<{ value_text: string }>(
        `SELECT value_text FROM document_field_values
         WHERE document_id = $1 AND field_storage_key = 'suggestion:vendor'`,
        [senderDocIds[i]]
      );
      expect(rows.rows).toEqual([{ value_text: realSenders[i] }]);
    }
  });
});
