import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('extraction persistence in normalized tables (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let repo: PgDocumentRepository;
  let userId: string;
  const documentId = randomUUID();
  const tagId = randomUUID();

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'E', email: `${userId}@example.test` });
    } finally {
      client.release();
    }
    repo = new PgDocumentRepository(pool);
    await pool.query(`INSERT INTO tags (id, user_id, name) VALUES ($1, $2, 'Rechnung')`, [
      tagId,
      userId,
    ]);
    await pool.query(
      `INSERT INTO recognized_field_definitions
       (id, user_id, field_key, label, field_type, sort_order, extract_for_all_documents)
       VALUES ($1, $2, 'betrag', 'Betrag', 'currency', 0, true),
              ($3, $2, 'rechnungsdatum', 'Rechnungsdatum', 'date', 1, true)`,
      [randomUUID(), userId, randomUUID()]
    );
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'x.pdf', 'application/pdf', 'k', 'ready')`,
      [documentId, userId]
    );
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('stores fields with derived search columns and blocks in order', async () => {
    await repo.saveExtraction(documentId, {
      text: 'hello',
      fields: [
        { key: 'global:betrag', value: '12,50 €', confidence: 0.8 },
        { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 0.9 },
        { key: 'kundennummer', value: 'K-7', tagId },
      ],
      blocks: [
        { page: 1, blockIndex: 0, x: 0.1, y: 0.2, width: 0.3, height: 0.1, text: 'erster' },
        { page: 1, blockIndex: 1, x: 0.1, y: 0.4, width: 0.3, height: 0.1, text: 'zweiter' },
      ],
    });

    const fields = await pool.query<{
      field_storage_key: string;
      value_text: string;
      value_text_norm: string | null;
      value_numeric: number | null;
      value_date: string | null;
    }>(
      `SELECT field_storage_key, value_text, value_text_norm, value_numeric::float8 AS value_numeric,
              to_char(value_date, 'YYYY-MM-DD') AS value_date
       FROM document_field_values WHERE document_id = $1 ORDER BY field_storage_key`,
      [documentId]
    );
    expect(fields.rows[0]).toEqual({
      field_storage_key: 'global:betrag',
      value_text: '12,50 €',
      value_text_norm: null,
      value_numeric: 12.5,
      value_date: null,
    });
    expect(fields.rows[1]).toEqual({
      field_storage_key: 'global:rechnungsdatum',
      value_text: '15.03.2024',
      value_text_norm: null,
      value_numeric: null,
      value_date: '2024-03-15',
    });
    expect(fields.rows[2]).toMatchObject({
      field_storage_key: `label:${tagId}:kundennummer`,
      value_text: 'K-7',
      value_numeric: null,
      value_date: null,
    });
    expect(typeof fields.rows[2]?.value_text_norm).toBe('string');

    const loaded = await repo.findByIdForUser(documentId, userId);
    expect(loaded?.extraction?.blocks?.map((b) => b.text)).toEqual(['erster', 'zweiter']);
    const labelField = loaded?.extraction?.fields.find((f) => f.key.endsWith(':kundennummer'));
    expect(labelField?.tagId).toBe(tagId);

    const listed = await repo.listForUser(userId);
    expect(listed.find((d) => d.id === documentId)?.extraction?.fields).toHaveLength(3);
  });

  it('replaces fields and blocks on user edits', async () => {
    await repo.updateForUser(documentId, userId, {
      extractionFields: [{ key: 'global:betrag', value: '99,00 €' }],
      extractionBlocks: [],
    });
    const rows = await pool.query(
      `SELECT field_storage_key, value_numeric::float8 AS value_numeric
       FROM document_field_values WHERE document_id = $1`,
      [documentId]
    );
    expect(rows.rows).toEqual([{ field_storage_key: 'global:betrag', value_numeric: 99 }]);
    const blocks = await pool.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM document_extraction_blocks WHERE document_id = $1`,
      [documentId]
    );
    expect(blocks.rows[0]?.c).toBe(0);
  });

  it('skips invalid layout IR version but persists extraction', async () => {
    const docId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'layout.pdf', 'application/pdf', 'k2', 'ready')`,
      [docId, userId]
    );
    await repo.saveExtraction(docId, {
      text: 'body',
      fields: [],
      blocks: [{ page: 1, blockIndex: 0, x: 0, y: 0, width: 1, height: 1, text: 'a' }],
      layoutIr: { version: 2, pages: [] },
    });
    const textRow = await pool.query<{ extracted_text: string }>(
      `SELECT extracted_text FROM documents WHERE id = $1`,
      [docId]
    );
    expect(textRow.rows[0]?.extracted_text).toBe('body');
    const layout = await pool.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM document_layout_ir WHERE document_id = $1`,
      [docId]
    );
    expect(layout.rows[0]?.c).toBe(0);
  });

  it('persists layout IR page summaries relationally', async () => {
    const docId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'layout.pdf', 'application/pdf', 'k3', 'ready')`,
      [docId, userId]
    );
    await repo.saveExtraction(docId, {
      text: 'body',
      fields: [],
      blocks: [],
      layoutIr: {
        version: 1,
        pages: [
          { page: 1, widthPt: 595, heightPt: 842, blocks: [] },
          { page: 2, widthPt: 595, heightPt: 842, blocks: [] },
        ],
      },
    });
    const pages = await pool.query(
      `SELECT page, width_pt, height_pt FROM document_layout_ir_pages WHERE document_id = $1 ORDER BY page`,
      [docId]
    );
    expect(pages.rows).toEqual([
      { page: 1, width_pt: 595, height_pt: 842 },
      { page: 2, width_pt: 595, height_pt: 842 },
    ]);
    const loaded = await repo.findByIdForUser(docId, userId);
    expect(loaded?.extraction?.layoutIrPages).toEqual([
      { page: 1, widthPt: 595, heightPt: 842 },
      { page: 2, widthPt: 595, heightPt: 842 },
    ]);
  });

  it('dedupes duplicate layout IR page numbers on save (first page entry wins)', async () => {
    const docId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'dup-pages.pdf', 'application/pdf', 'k4', 'ready')`,
      [docId, userId]
    );
    await repo.saveExtraction(docId, {
      text: 'body',
      fields: [],
      blocks: [],
      layoutIr: {
        version: 1,
        pages: [
          { page: 1, widthPt: 400, heightPt: 500, blocks: [] },
          { page: 1, widthPt: 595, heightPt: 842, blocks: [] },
          { page: 2, widthPt: 612, heightPt: 792, blocks: [] },
        ],
      },
    });
    const pages = await pool.query(
      `SELECT page, width_pt, height_pt FROM document_layout_ir_pages WHERE document_id = $1 ORDER BY page`,
      [docId]
    );
    expect(pages.rows).toEqual([
      { page: 1, width_pt: 400, height_pt: 500 },
      { page: 2, width_pt: 612, height_pt: 792 },
    ]);
    const layoutCount = await pool.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM document_layout_ir WHERE document_id = $1`,
      [docId]
    );
    expect(layoutCount.rows[0]?.c).toBe(1);
    const loaded = await repo.findByIdForUser(docId, userId);
    expect(loaded?.extraction?.layoutIrPages).toEqual([
      { page: 1, widthPt: 400, heightPt: 500 },
      { page: 2, widthPt: 612, heightPt: 792 },
    ]);
  });
});
