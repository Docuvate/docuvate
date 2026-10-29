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

  it('stores a table region with header rows and cell texts', async () => {
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
        headerCols: 0,
        rules: [
          { axis: 'row', ord: 0, pos: 0.1 },
          { axis: 'row', ord: 1, pos: 0.25 },
          { axis: 'row', ord: 2, pos: 0.4 },
          { axis: 'col', ord: 0, pos: 0.1 },
          { axis: 'col', ord: 1, pos: 0.35 },
          { axis: 'col', ord: 2, pos: 0.6 },
        ],
        merges: [],
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
    expect(listed.some((region) => region.id === created.id && region.table?.cells[0]?.text === 'Item')).toBe(
      true
    );
  });

  it('stores a block region with type and reading rank', async () => {
    const created = await regions.insertRegion({
      id: randomUUID(),
      documentId,
      page: 1,
      shape: 'rect',
      role: 'block',
      x0: 0.1,
      y0: 0.2,
      x1: 0.7,
      y1: 0.3,
      irSha256: hashLayoutIrHex(sampleIr('208,82 €')),
      blockIndexes: [4],
      boundText: 'Widget A',
      block: {
        blockType: 'heading',
        headingLevel: 2,
        readingRank: 1,
      },
    });
    expect(created.block?.blockType).toBe('heading');
    expect(created.block?.headingLevel).toBe(2);
    expect(created.block?.readingRank).toBe(1);
    const listed = await regions.listActiveRegions(documentId, 'block');
    expect(listed.some((region) => region.id === created.id && region.block?.blockType === 'heading')).toBe(
      true
    );
  });
});
