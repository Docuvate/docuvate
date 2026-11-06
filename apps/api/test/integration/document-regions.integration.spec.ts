// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { hashLayoutIrHex } from '../../src/modules/document-regions/domain/ir-hash.js';
import { layoutTokensFromIr } from '../../src/modules/document-regions/domain/layout-tokens.js';
import { PgDocumentRegionRepository } from '../../src/modules/document-regions/infrastructure/pg-document-region.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

function sampleIr(text: string) {
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
            x: 0.2,
            y: 0.3,
            width: 0.12,
            height: 0.04,
            text,
            blockIndex: 4,
          },
          {
            page: 1,
            x: 0.7,
            y: 0.8,
            width: 0.1,
            height: 0.03,
            text: 'Ende',
            blockIndex: 9,
          },
        ],
      },
    ],
  };
}

describe('document regions (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  const documentId = randomUUID();
  let regions: PgDocumentRegionRepository;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'R', email: `${userId}@example.test` });
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'regions.pdf', 'application/pdf', 'k', 'ready')`,
      [documentId, userId]
    );
    const ir = sampleIr('208,82 €');
    await pool.query(
      `INSERT INTO document_layout_ir (document_id, version, ir, ir_sha256)
       VALUES ($1, 1, $2::jsonb, decode($3, 'hex'))`,
      [documentId, JSON.stringify(ir), hashLayoutIrHex(ir)]
    );
    regions = new PgDocumentRegionRepository(pool);
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('stores a field region and remaps tokens by geometry after a new IR', async () => {
    const first = await regions.insertRegion({
      id: randomUUID(),
      documentId,
      page: 1,
      shape: 'rect',
      role: 'field',
      x0: 0.2,
      y0: 0.3,
      x1: 0.32,
      y1: 0.34,
      irSha256: hashLayoutIrHex(sampleIr('208,82 €')),
      blockIndexes: [4],
      boundText: '208,82 €',
      fieldKey: 'global:nachzahlung',
      valueOverride: '208,82 €',
    });
    expect(first.blockIndexes).toEqual([4]);

    const nextIr = sampleIr('210,00 €');
    const nextHash = hashLayoutIrHex(nextIr);
    await regions.remapActiveRegions(documentId, layoutTokensFromIr(nextIr), nextHash);
    const remapped = await regions.findActiveFieldRegion(documentId, 'global:nachzahlung');
    expect(remapped?.needsReview).toBe(true);
    expect(remapped?.blockIndexes).toEqual([4]);
    expect(remapped?.irSha256).toBe(nextHash);
  });

  it('stores a table region with header rows, merged cells and cell texts', async () => {
    const created = await regions.insertRegion({
      id: randomUUID(),
      documentId,
      page: 1,
      shape: 'rect',
      role: 'table',
      x0: 0.1,
      y0: 0.1,
      x1: 0.6,
      y1: 0.4,
      irSha256: hashLayoutIrHex(sampleIr('208,82 €')),
      blockIndexes: [4, 9],
      boundText: 'Item Qty',
      table: {
        tableType: 'line_items',
        headerRows: 1,
        footerRows: 0,
        headerCols: 0,
        trailingHeaderCols: 0,
        banded: false,
        rowRoles: [],
        rules: [
          { axis: 'row', ord: 0, pos: 0.1, line: 'unknown' },
          { axis: 'row', ord: 1, pos: 0.25, line: 'unknown' },
          { axis: 'row', ord: 2, pos: 0.4, line: 'unknown' },
          { axis: 'col', ord: 0, pos: 0.1, line: 'unknown' },
          { axis: 'col', ord: 1, pos: 0.35, line: 'unknown' },
          { axis: 'col', ord: 2, pos: 0.6, line: 'unknown' },
        ],
        merges: [{ row0: 1, col0: 0, rowSpan: 1, colSpan: 2 }],
        cells: [
          { row: 0, col: 0, text: 'Item' },
          { row: 0, col: 1, text: 'Qty' },
          { row: 1, col: 0, text: 'Widget A' },
          { row: 1, col: 1, text: '2' },
        ],
      },
    });
    expect(created.table?.headerRows).toBe(1);
    expect(created.table?.cells).toHaveLength(4);
    const listed = await regions.listActiveRegions(documentId, 'table');
    expect(
      listed.some((region) => region.id === created.id && region.table?.cells[0]?.text === 'Item')
    ).toBe(true);
    const stored = listed.find((region) => region.id === created.id);
    expect(stored?.table?.merges).toEqual([{ row0: 1, col0: 0, rowSpan: 1, colSpan: 2 }]);
  });

  it('round-trips footer, right index, row roles, banding and line evidence', async () => {
    const rows = 4;
    const cols = 3;
    const created = await regions.insertRegion({
      id: randomUUID(),
      documentId,
      page: 1,
      shape: 'rect',
      role: 'table',
      x0: 0.1,
      y0: 0.1,
      x1: 0.6,
      y1: 0.5,
      irSha256: hashLayoutIrHex(sampleIr('208,82 €')),
      blockIndexes: [4],
      boundText: 'Synthetic',
      table: {
        tableType: 'line_items',
        headerRows: 1,
        footerRows: 1,
        headerCols: 0,
        trailingHeaderCols: 1,
        banded: true,
        rowRoles: [{ row: 1, role: 'section' }],
        rules: [
          ...Array.from({ length: rows + 1 }, (_, ord) => ({
            axis: 'row' as const,
            ord,
            pos: 0.1 + ord * 0.1,
            line: ord === 1 ? ('thick' as const) : ('thin' as const),
          })),
          ...Array.from({ length: cols + 1 }, (_, ord) => ({
            axis: 'col' as const,
            ord,
            pos: 0.1 + ord * 0.15,
            line: 'none' as const,
          })),
        ],
        merges: [{ row0: 1, col0: 0, rowSpan: 1, colSpan: 3 }],
        cells: [{ row: 1, col: 0, text: 'Abschnitt A' }],
      },
    });
    const listed = await regions.listActiveRegions(documentId, 'table');
    const stored = listed.find((region) => region.id === created.id)?.table;
    expect(stored).toMatchObject({
      footerRows: 1,
      trailingHeaderCols: 1,
      banded: true,
      rowRoles: [{ row: 1, role: 'section' }],
    });
    expect(stored?.rules.find((rule) => rule.axis === 'row' && rule.ord === 1)?.line).toBe('thick');
    expect(
      stored?.rules.filter((rule) => rule.axis === 'col').every((rule) => rule.line === 'none')
    ).toBe(true);
  });
});
