// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionRole,
  DocumentRegionShape,
  DocumentRegionTableDto,
  DocumentRegionTableType,
  FieldCorrectionOp,
  FieldCorrectionScope,
  LayoutToken,
  TableCorrectionOp,
} from '@docuvate/contracts';
import { remapRegionTokens } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';

import type {
  DocumentLayoutIrSnapshot,
  DocumentRegionRecord,
  DocumentRegionRepository,
  InsertDocumentRegionInput,
  InsertFieldCorrectionInput,
  InsertTableCorrectionInput,
} from '../../../shared/domain/ports.js';
import {
  parseBoolean,
  parseNumber,
  parseOptionalString,
  parseString,
  recordFromUnknown,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { bufferToHex } from '../domain/ir-hash.js';

function parseRole(value: unknown): DocumentRegionRole {
  const role = parseString(value);
  switch (role) {
    case 'field':
    case 'table':
    case 'block':
    case 'ignore':
      return role;
    default:
      return 'field';
  }
}

function parseShape(value: unknown): DocumentRegionShape {
  const shape = parseString(value);
  switch (shape) {
    case 'rect':
    case 'polygon':
      return shape;
    default:
      return 'rect';
  }
}

function parseOp(value: unknown): FieldCorrectionOp {
  const op = parseString(value);
  switch (op) {
    case 'create':
    case 'reanchor':
    case 'edit_value':
    case 'remove':
      return op;
    default:
      return 'create';
  }
}

function parseScope(value: unknown): FieldCorrectionScope {
  const scope = parseString(value);
  switch (scope) {
    case 'document':
    case 'label':
    case 'always':
      return scope;
    default:
      return 'document';
  }
}

function parseTableOp(value: unknown): TableCorrectionOp {
  const op = parseString(value);
  switch (op) {
    case 'create':
    case 'set_headers':
    case 'edit_cell':
    case 'remove':
      return op;
    default:
      return 'create';
  }
}

function parseTableType(value: unknown): DocumentRegionTableType {
  const type = parseString(value);
  switch (type) {
    case 'line_items':
    case 'key_value':
    case 'other':
      return type;
    default:
      return 'other';
  }
}

function parseIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const raw = parseString(value);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }
  return parsed.toISOString();
}

function parseRegionRow(
  row: Record<string, unknown>,
  blockIndexes: number[]
): DocumentRegionRecord {
  return {
    id: parseString(row.id),
    documentId: parseString(row.document_id),
    page: parseNumber(row.page, 1),
    shape: parseShape(row.shape),
    role: parseRole(row.role),
    x0: parseNumber(row.x0),
    y0: parseNumber(row.y0),
    x1: parseNumber(row.x1),
    y1: parseNumber(row.y1),
    irSha256: bufferToHex(row.ir_sha256),
    needsReview: parseBoolean(row.needs_review),
    blockIndexes,
    field:
      typeof row.field_key === 'string' && row.field_key.length > 0
        ? {
            fieldKey: row.field_key,
            valueOverride: parseOptionalString(row.value_override),
          }
        : undefined,
    createdAt: parseIsoDate(row.created_at),
    supersededBy: parseOptionalString(row.superseded_by),
  };
}

async function loadBlockIndexes(
  client: Pool | PoolClient,
  regionIds: string[]
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  if (regionIds.length === 0) {
    return map;
  }
  const result = await client.query(
    `SELECT region_id, block_index
     FROM document_region_tokens
     WHERE region_id = ANY($1::uuid[])
     ORDER BY region_id, block_index`,
    [regionIds]
  );
  for (const raw of result.rows) {
    const row = recordFromUnknown(raw);
    if (!row) {
      continue;
    }
    const regionId = parseString(row.region_id);
    const existing = map.get(regionId) ?? [];
    existing.push(parseNumber(row.block_index, 0));
    map.set(regionId, existing);
  }
  return map;
}

async function loadTableSatellites(
  client: Pool | PoolClient,
  regionIds: string[]
): Promise<Map<string, DocumentRegionTableDto>> {
  const map = new Map<string, DocumentRegionTableDto>();
  if (regionIds.length === 0) {
    return map;
  }
  const heads = await client.query(
    `SELECT region_id, table_type, header_rows, header_cols
     FROM document_region_tables
     WHERE region_id = ANY($1::uuid[])`,
    [regionIds]
  );
  for (const raw of heads.rows) {
    const row = recordFromUnknown(raw);
    if (!row) {
      continue;
    }
    map.set(parseString(row.region_id), {
      tableType: parseTableType(row.table_type),
      headerRows: parseNumber(row.header_rows, 0),
      headerCols: parseNumber(row.header_cols, 0),
      rules: [],
      merges: [],
      cells: [],
    });
  }
  const rules = await client.query(
    `SELECT region_id, axis, ord, pos
     FROM document_region_table_rules
     WHERE region_id = ANY($1::uuid[])
     ORDER BY region_id, axis, ord`,
    [regionIds]
  );
  for (const raw of rules.rows) {
    const row = recordFromUnknown(raw);
    if (!row) {
      continue;
    }
    const table = map.get(parseString(row.region_id));
    if (!table) {
      continue;
    }
    const axisRaw = parseString(row.axis);
    table.rules.push({
      axis: axisRaw === 'col' ? 'col' : 'row',
      ord: parseNumber(row.ord, 0),
      pos: parseNumber(row.pos),
    });
  }
  const cells = await client.query(
    `SELECT region_id, row, col, text
     FROM document_region_table_cell_texts
     WHERE region_id = ANY($1::uuid[])
     ORDER BY region_id, row, col`,
    [regionIds]
  );
  for (const raw of cells.rows) {
    const row = recordFromUnknown(raw);
    if (!row) {
      continue;
    }
    const table = map.get(parseString(row.region_id));
    if (!table) {
      continue;
    }
    table.cells.push({
      row: parseNumber(row.row, 0),
      col: parseNumber(row.col, 0),
      text: parseString(row.text),
    });
  }
  const merges = await client.query(
    `SELECT region_id, row0, col0, row_span, col_span
     FROM document_region_table_merges
     WHERE region_id = ANY($1::uuid[])
     ORDER BY region_id, row0, col0`,
    [regionIds]
  );
  for (const raw of merges.rows) {
    const row = recordFromUnknown(raw);
    if (!row) {
      continue;
    }
    const table = map.get(parseString(row.region_id));
    if (!table) {
      continue;
    }
    table.merges.push({
      row0: parseNumber(row.row0, 0),
      col0: parseNumber(row.col0, 0),
      rowSpan: parseNumber(row.row_span, 1),
      colSpan: parseNumber(row.col_span, 1),
    });
  }
  return map;
}

function attachTable(
  region: DocumentRegionRecord,
  tables: Map<string, DocumentRegionTableDto>
): DocumentRegionRecord {
  const table = tables.get(region.id);
  if (!table) {
    return region;
  }
  return { ...region, table };
}

export async function remapActiveRegionsOnClient(
  client: PoolClient,
  documentId: string,
  tokens: readonly LayoutToken[],
  irSha256Hex: string
): Promise<void> {
  const active = await client.query(
    `SELECT r.id, r.page, r.x0, r.y0, r.x1, r.y1, r.ir_sha256, r.bound_text
     FROM document_regions r
     WHERE r.document_id = $1 AND r.superseded_by IS NULL`,
    [documentId]
  );
  const tokensByPage = new Map<number, LayoutToken[]>();
  for (const token of tokens) {
    const list = tokensByPage.get(token.page) ?? [];
    list.push(token);
    tokensByPage.set(token.page, list);
  }
  const irSha256 = Buffer.from(irSha256Hex, 'hex');
  for (const raw of active.rows) {
    const row = recordFromUnknown(raw);
    if (!row) {
      continue;
    }
    const regionId = parseString(row.id);
    const page = parseNumber(row.page, 1);
    const previousText = parseString(row.bound_text);
    const previousTokens: LayoutToken[] =
      previousText.length > 0
        ? [
            {
              blockIndex: -1,
              page,
              x0: 0,
              y0: 0,
              x1: 0.001,
              y1: 0.001,
              text: previousText,
            },
          ]
        : [];
    const remapped = remapRegionTokens(previousTokens, tokensByPage.get(page) ?? [], {
      x0: parseNumber(row.x0),
      y0: parseNumber(row.y0),
      x1: parseNumber(row.x1),
      y1: parseNumber(row.y1),
    });
    await client.query(`DELETE FROM document_region_tokens WHERE region_id = $1`, [regionId]);
    if (remapped.tokens.length > 0) {
      await client.query(
        `INSERT INTO document_region_tokens (region_id, block_index)
         SELECT $1, unnest($2::int[])`,
        [regionId, remapped.tokens.map((token) => token.blockIndex)]
      );
    }
    const snapped = remapped.snappedRect;
    await client.query(
      `UPDATE document_regions
       SET ir_sha256 = $2,
           needs_review = $3,
           bound_text = $4,
           x0 = COALESCE($5, x0),
           y0 = COALESCE($6, y0),
           x1 = COALESCE($7, x1),
           y1 = COALESCE($8, y1)
       WHERE id = $1`,
      [
        regionId,
        irSha256,
        remapped.textChanged || remapped.tokens.length === 0,
        remapped.nextText,
        snapped?.x0 ?? null,
        snapped?.y0 ?? null,
        snapped?.x1 ?? null,
        snapped?.y1 ?? null,
      ]
    );
  }
}

@Injectable()
export class PgDocumentRegionRepository implements DocumentRegionRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findLayoutIrSnapshot(
    documentId: string,
    userId: string
  ): Promise<DocumentLayoutIrSnapshot | null> {
    const result = await this.pool.query(
      `SELECT li.ir, encode(li.ir_sha256, 'hex') AS ir_sha256
       FROM document_layout_ir li
       INNER JOIN documents d ON d.id = li.document_id
       WHERE li.document_id = $1 AND d.user_id = $2`,
      [documentId, userId]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    const ir = recordFromUnknown(row.ir);
    if (!ir) {
      return null;
    }
    return { ir, irSha256: parseString(row.ir_sha256) };
  }

  async listActiveRegions(
    documentId: string,
    role?: DocumentRegionRole
  ): Promise<DocumentRegionRecord[]> {
    const result = await this.pool.query(
      `SELECT r.id, r.document_id, r.page, r.x0, r.y0, r.x1, r.y1, r.shape, r.role,
              encode(r.ir_sha256, 'hex') AS ir_sha256, r.superseded_by, r.needs_review, r.created_at,
              f.field_key, f.value_override
       FROM document_regions r
       LEFT JOIN document_region_fields f ON f.region_id = r.id
       WHERE r.document_id = $1
         AND r.superseded_by IS NULL
         AND ($2::text IS NULL OR r.role = $2)
       ORDER BY r.created_at DESC`,
      [documentId, role ?? null]
    );
    const rows: Record<string, unknown>[] = [];
    const ids: string[] = [];
    for (const raw of result.rows) {
      const row = recordFromUnknown(raw);
      if (!row) {
        continue;
      }
      rows.push(row);
      ids.push(parseString(row.id));
    }
    const tokens = await loadBlockIndexes(this.pool, ids);
    const tables = await loadTableSatellites(this.pool, ids);
    return rows.map((row) =>
      attachTable(parseRegionRow(row, tokens.get(parseString(row.id)) ?? []), tables)
    );
  }

  async findRegionById(documentId: string, regionId: string): Promise<DocumentRegionRecord | null> {
    const result = await this.pool.query(
      `SELECT r.id, r.document_id, r.page, r.x0, r.y0, r.x1, r.y1, r.shape, r.role,
              encode(r.ir_sha256, 'hex') AS ir_sha256, r.superseded_by, r.needs_review, r.created_at,
              f.field_key, f.value_override
       FROM document_regions r
       LEFT JOIN document_region_fields f ON f.region_id = r.id
       WHERE r.document_id = $1 AND r.id = $2`,
      [documentId, regionId]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    const tokens = await loadBlockIndexes(this.pool, [regionId]);
    const tables = await loadTableSatellites(this.pool, [regionId]);
    return attachTable(parseRegionRow(row, tokens.get(regionId) ?? []), tables);
  }

  async findActiveFieldRegion(
    documentId: string,
    fieldKey: string
  ): Promise<DocumentRegionRecord | null> {
    const result = await this.pool.query(
      `SELECT r.id, r.document_id, r.page, r.x0, r.y0, r.x1, r.y1, r.shape, r.role,
              encode(r.ir_sha256, 'hex') AS ir_sha256, r.superseded_by, r.needs_review, r.created_at,
              f.field_key, f.value_override
       FROM document_regions r
       INNER JOIN document_region_fields f ON f.region_id = r.id
       WHERE r.document_id = $1 AND f.field_key = $2 AND r.superseded_by IS NULL
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [documentId, fieldKey]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    const regionId = parseString(row.id);
    const tokens = await loadBlockIndexes(this.pool, [regionId]);
    return parseRegionRow(row, tokens.get(regionId) ?? []);
  }

  async insertRegion(input: InsertDocumentRegionInput): Promise<DocumentRegionRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO document_regions
           (id, document_id, page, x0, y0, x1, y1, shape, role, ir_sha256, bound_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, decode($10, 'hex'), $11)`,
        [
          input.id,
          input.documentId,
          input.page,
          input.x0,
          input.y0,
          input.x1,
          input.y1,
          input.shape,
          input.role,
          input.irSha256,
          input.boundText ?? '',
        ]
      );
      if (input.blockIndexes.length > 0) {
        await client.query(
          `INSERT INTO document_region_tokens (region_id, block_index)
           SELECT $1, unnest($2::int[])`,
          [input.id, [...input.blockIndexes]]
        );
      }
      if (input.fieldKey) {
        await client.query(
          `INSERT INTO document_region_fields (region_id, field_key, value_override)
           VALUES ($1, $2, $3)`,
          [input.id, input.fieldKey, input.valueOverride ?? null]
        );
      }
      if (input.table) {
        await client.query(
          `INSERT INTO document_region_tables (region_id, table_type, header_rows, header_cols)
           VALUES ($1, $2, $3, $4)`,
          [input.id, input.table.tableType, input.table.headerRows, input.table.headerCols]
        );
        for (const rule of input.table.rules) {
          await client.query(
            `INSERT INTO document_region_table_rules (region_id, axis, ord, pos)
             VALUES ($1, $2, $3, $4)`,
            [input.id, rule.axis, rule.ord, rule.pos]
          );
        }
        for (const cell of input.table.cells) {
          await client.query(
            `INSERT INTO document_region_table_cell_texts (region_id, row, col, text)
             VALUES ($1, $2, $3, $4)`,
            [input.id, cell.row, cell.col, cell.text]
          );
        }
        for (const merge of input.table.merges) {
          await client.query(
            `INSERT INTO document_region_table_merges (region_id, row0, col0, row_span, col_span)
             VALUES ($1, $2, $3, $4, $5)`,
            [input.id, merge.row0, merge.col0, merge.rowSpan, merge.colSpan]
          );
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    const created = await this.findRegionById(input.documentId, input.id);
    if (!created) {
      throw new Error('document region insert did not persist');
    }
    return created;
  }

  async supersedeRegion(regionId: string, successorId: string | null): Promise<void> {
    await this.pool.query(`UPDATE document_regions SET superseded_by = $2 WHERE id = $1`, [
      regionId,
      successorId,
    ]);
  }

  async insertFieldCorrection(input: InsertFieldCorrectionInput): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO corrections (id, user_id, document_id, kind, created_by, status)
         VALUES ($1, $2, $3, 'field', $2, 'active')
         ON CONFLICT (id) DO NOTHING`,
        [input.id, input.userId, input.documentId]
      );
      if (inserted.rowCount === 0) {
        await client.query('COMMIT');
        return false;
      }
      await client.query(
        `INSERT INTO correction_region_changes (correction_id, op, before_region_id, after_region_id)
         VALUES ($1, $2, $3, $4)`,
        [input.id, input.op, input.beforeRegionId, input.afterRegionId]
      );
      if (input.oldValue != null || input.newValue != null) {
        await client.query(
          `INSERT INTO correction_field_values (correction_id, old_value, new_value)
           VALUES ($1, $2, $3)`,
          [input.id, input.oldValue, input.newValue]
        );
      }
      await client.query(
        `INSERT INTO correction_field_scopes (correction_id, scope, tag_id)
         VALUES ($1, $2, $3)`,
        [input.id, input.scope, input.tagId]
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findFieldCorrection(
    documentId: string,
    correctionId: string
  ): Promise<InsertFieldCorrectionInput | null> {
    const result = await this.pool.query(
      `SELECT c.id, c.user_id, c.document_id, ch.op, ch.before_region_id, ch.after_region_id,
              fv.old_value, fv.new_value, sc.scope, sc.tag_id, f.field_key
       FROM corrections c
       INNER JOIN correction_region_changes ch ON ch.correction_id = c.id
       LEFT JOIN correction_field_values fv ON fv.correction_id = c.id
       LEFT JOIN correction_field_scopes sc ON sc.correction_id = c.id
       LEFT JOIN document_region_fields f ON f.region_id IN (ch.after_region_id, ch.before_region_id)
       WHERE c.id = $1 AND c.document_id = $2 AND c.kind = 'field'
       LIMIT 1`,
      [correctionId, documentId]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    return {
      id: parseString(row.id),
      userId: parseString(row.user_id),
      documentId: parseString(row.document_id),
      op: parseOp(row.op),
      fieldKey: parseString(row.field_key),
      beforeRegionId: parseOptionalString(row.before_region_id),
      afterRegionId: parseOptionalString(row.after_region_id),
      oldValue: parseOptionalString(row.old_value),
      newValue: parseOptionalString(row.new_value),
      scope: parseScope(row.scope),
      tagId: parseOptionalString(row.tag_id),
    };
  }

  async withdrawFieldCorrection(documentId: string, correctionId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        `SELECT c.id, ch.op, ch.before_region_id, ch.after_region_id
         FROM corrections c
         INNER JOIN correction_region_changes ch ON ch.correction_id = c.id
         WHERE c.id = $1 AND c.document_id = $2 AND c.kind = 'field' AND c.status = 'active'
         FOR UPDATE`,
        [correctionId, documentId]
      );
      const row = recordFromUnknown(current.rows[0]);
      if (!row) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        `UPDATE corrections
         SET status = 'withdrawn', withdrawn_at = now()
         WHERE id = $1`,
        [correctionId]
      );
      const beforeId = parseOptionalString(row.before_region_id);
      const afterId = parseOptionalString(row.after_region_id);
      if (afterId && beforeId) {
        await client.query(`UPDATE document_regions SET superseded_by = $2 WHERE id = $1`, [
          afterId,
          beforeId,
        ]);
        await client.query(`UPDATE document_regions SET superseded_by = NULL WHERE id = $1`, [
          beforeId,
        ]);
      } else if (afterId) {
        await client.query(`UPDATE document_regions SET superseded_by = $1 WHERE id = $1`, [
          afterId,
        ]);
      } else if (beforeId) {
        await client.query(`UPDATE document_regions SET superseded_by = NULL WHERE id = $1`, [
          beforeId,
        ]);
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async insertTableCorrection(input: InsertTableCorrectionInput): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO corrections (id, user_id, document_id, kind, created_by, status)
         VALUES ($1, $2, $3, 'table', $2, 'active')
         ON CONFLICT (id) DO NOTHING`,
        [input.id, input.userId, input.documentId]
      );
      if (inserted.rowCount === 0) {
        await client.query('COMMIT');
        return false;
      }
      await client.query(
        `INSERT INTO correction_region_changes (correction_id, op, before_region_id, after_region_id)
         VALUES ($1, $2, $3, $4)`,
        [input.id, input.op, input.beforeRegionId, input.afterRegionId]
      );
      if (input.oldValue != null || input.newValue != null) {
        await client.query(
          `INSERT INTO correction_field_values (correction_id, old_value, new_value)
           VALUES ($1, $2, $3)`,
          [input.id, input.oldValue, input.newValue]
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findTableCorrection(
    documentId: string,
    correctionId: string
  ): Promise<InsertTableCorrectionInput | null> {
    const result = await this.pool.query(
      `SELECT c.id, c.user_id, c.document_id, ch.op, ch.before_region_id, ch.after_region_id,
              fv.old_value, fv.new_value
       FROM corrections c
       INNER JOIN correction_region_changes ch ON ch.correction_id = c.id
       LEFT JOIN correction_field_values fv ON fv.correction_id = c.id
       WHERE c.id = $1 AND c.document_id = $2 AND c.kind = 'table'
       LIMIT 1`,
      [correctionId, documentId]
    );
    const row = recordFromUnknown(result.rows[0]);
    if (!row) {
      return null;
    }
    return {
      id: parseString(row.id),
      userId: parseString(row.user_id),
      documentId: parseString(row.document_id),
      op: parseTableOp(row.op),
      beforeRegionId: parseOptionalString(row.before_region_id),
      afterRegionId: parseOptionalString(row.after_region_id),
      oldValue: parseOptionalString(row.old_value),
      newValue: parseOptionalString(row.new_value),
    };
  }

  async withdrawTableCorrection(documentId: string, correctionId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        `SELECT c.id, ch.op, ch.before_region_id, ch.after_region_id
         FROM corrections c
         INNER JOIN correction_region_changes ch ON ch.correction_id = c.id
         WHERE c.id = $1 AND c.document_id = $2 AND c.kind = 'table' AND c.status = 'active'
         FOR UPDATE`,
        [correctionId, documentId]
      );
      const row = recordFromUnknown(current.rows[0]);
      if (!row) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        `UPDATE corrections
         SET status = 'withdrawn', withdrawn_at = now()
         WHERE id = $1`,
        [correctionId]
      );
      const beforeId = parseOptionalString(row.before_region_id);
      const afterId = parseOptionalString(row.after_region_id);
      if (afterId && beforeId) {
        await client.query(`UPDATE document_regions SET superseded_by = $2 WHERE id = $1`, [
          afterId,
          beforeId,
        ]);
        await client.query(`UPDATE document_regions SET superseded_by = NULL WHERE id = $1`, [
          beforeId,
        ]);
      } else if (afterId) {
        await client.query(`UPDATE document_regions SET superseded_by = $1 WHERE id = $1`, [
          afterId,
        ]);
      } else if (beforeId) {
        await client.query(`UPDATE document_regions SET superseded_by = NULL WHERE id = $1`, [
          beforeId,
        ]);
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async confirmField(input: {
    documentId: string;
    userId: string;
    fieldKey: string;
    valueSha256: Buffer;
    fieldTagId: string | null;
  }): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO extraction_field_confirmations
         (user_id, document_id, field_key, field_tag_id, value_sha256)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, document_id, field_key)
       DO UPDATE SET
         value_sha256 = EXCLUDED.value_sha256,
         confirmed_at = now()
       WHERE extraction_field_confirmations.value_sha256 IS DISTINCT FROM EXCLUDED.value_sha256`,
      [input.userId, input.documentId, input.fieldKey, input.fieldTagId, input.valueSha256]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async replaceFieldTokenSpans(
    documentId: string,
    fieldKey: string,
    blockIndexes: readonly number[]
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM document_field_token_spans WHERE document_id = $1 AND field_key = $2`,
        [documentId, fieldKey]
      );
      if (blockIndexes.length > 0) {
        await client.query(
          `INSERT INTO document_field_token_spans (document_id, field_key, block_index)
           SELECT $1, $2, unnest($3::int[])`,
          [documentId, fieldKey, [...blockIndexes]]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async remapActiveRegions(
    documentId: string,
    tokens: readonly LayoutToken[],
    irSha256: string
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await remapActiveRegionsOnClient(client, documentId, tokens, irSha256);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

