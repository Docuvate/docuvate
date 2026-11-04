// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  ExtractedFactAnchor,
  FieldFeedbackAnchorReader,
  FieldRegionAnchor,
} from '../../../shared/domain/ports.js';
import {
  parseNumber,
  parseNumberArray,
  parseOptionalNumber,
  parseString,
  requireRecord,
} from '../../../shared/domain/row-parse.js';
import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

const REGIONS_SQL = `
  SELECT f.field_key, r.page, r.x0, r.y0, r.x1, r.y1,
    COALESCE(
      (SELECT array_agg(t.block_index ORDER BY t.block_index)
       FROM document_region_tokens t WHERE t.region_id = r.id),
      ARRAY[]::int[]
    ) AS block_indexes
  FROM document_regions r
  JOIN document_region_fields f ON f.region_id = r.id
  JOIN documents d ON d.id = r.document_id
  WHERE r.document_id = $1 AND d.user_id = $2
    AND r.role = 'field' AND r.superseded_by IS NULL
`;

const FACTS_SQL = `
  SELECT f.predicate_key,
    COALESCE(vt.value_text, vd.value_date::text, va.amount_numeric::text) AS value,
    p.page, p.char_start, p.char_end, p.bbox_x, p.bbox_y, p.bbox_width, p.bbox_height
  FROM document_extracted_fact f
  JOIN document_extracted_fact_provenance p ON p.fact_id = f.id
  LEFT JOIN document_extracted_fact_value_text vt ON vt.fact_id = f.id
  LEFT JOIN document_extracted_fact_value_date vd ON vd.fact_id = f.id
  LEFT JOIN document_extracted_fact_value_amount va ON va.fact_id = f.id
  WHERE f.tenant_id = $1 AND f.document_id = $2 AND f.kind <> 'table_cell'
`;

function mapRegion(row: Record<string, unknown>): FieldRegionAnchor {
  return {
    fieldKey: parseString(row.field_key),
    page: parseNumber(row.page, 1),
    bbox: {
      x0: parseNumber(row.x0),
      y0: parseNumber(row.y0),
      x1: parseNumber(row.x1),
      y1: parseNumber(row.y1),
    },
    blockIndexes: parseNumberArray(row.block_indexes),
  };
}

function mapFact(row: Record<string, unknown>): ExtractedFactAnchor {
  const x = parseOptionalNumber(row.bbox_x);
  const y = parseOptionalNumber(row.bbox_y);
  const width = parseOptionalNumber(row.bbox_width);
  const height = parseOptionalNumber(row.bbox_height);
  return {
    predicateKey: parseString(row.predicate_key),
    value: parseString(row.value),
    page: parseOptionalNumber(row.page),
    docCharStart: parseOptionalNumber(row.char_start),
    docCharEnd: parseOptionalNumber(row.char_end),
    bbox:
      x !== null && y !== null && width !== null && height !== null
        ? { x, y, width, height }
        : null,
  };
}

/** Reads stored provenance only; model facts are read under the user's tenant RLS scope. */
@Injectable()
export class PgFieldFeedbackAnchorReader implements FieldFeedbackAnchorReader {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listAnchors(
    userId: string,
    documentId: string
  ): Promise<{ regions: FieldRegionAnchor[]; facts: ExtractedFactAnchor[] }> {
    const regions = await this.pool.query(REGIONS_SQL, [documentId, userId]);
    const facts = await withTenantPgClient(this.pool, userId, (client) =>
      client.query(FACTS_SQL, [userId, documentId])
    );
    return {
      regions: regions.rows.map((row) => mapRegion(requireRecord(row))),
      facts: facts.rows.map((row) => mapFact(requireRecord(row))),
    };
  }
}
