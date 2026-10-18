// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedFactKind } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { ParsedExactFactQuery } from '../domain/exact-fact-query.types.js';
import type { ExactFactRow } from '../domain/exact-fact-row.js';

interface FactQueryRow {
  fact_id: string;
  document_id: string;
  document_title: string;
  kind: ExtractedFactKind;
  predicate_key: string;
  confidence: number;
  value_text: string | null;
  amount_numeric: string | null;
  currency_code: string | null;
  value_date: Date | null;
  page: number | null;
  bbox_x: number | null;
  bbox_y: number | null;
  bbox_width: number | null;
  bbox_height: number | null;
  char_start: number | null;
  char_end: number | null;
}

function mapRow(row: FactQueryRow): ExactFactRow {
  const amount =
    row.amount_numeric != null && row.amount_numeric !== ''
      ? Number(row.amount_numeric)
      : null;
  const amountNumeric = amount != null && Number.isFinite(amount) ? amount : null;
  const valueDateIso =
    row.value_date instanceof Date
      ? row.value_date.toISOString().slice(0, 10)
      : null;
  return {
    factId: row.fact_id,
    documentId: row.document_id,
    documentTitle: row.document_title,
    kind: row.kind,
    predicateKey: row.predicate_key,
    confidence: row.confidence,
    valueText: row.value_text,
    amountNumeric,
    currencyCode: row.currency_code,
    valueDateIso,
    page: row.page,
    bboxX: row.bbox_x,
    bboxY: row.bbox_y,
    bboxWidth: row.bbox_width,
    bboxHeight: row.bbox_height,
    charStart: row.char_start,
    charEnd: row.char_end,
  };
}

interface QueryFilters {
  whereSql: string;
  params: unknown[];
}

function buildQueryFilters(
  tenantParam: number,
  query: ParsedExactFactQuery,
  documentIds: readonly string[] | undefined
): QueryFilters {
  const params: unknown[] = [];
  const clauses: string[] = [`f.tenant_id = $${String(tenantParam)}`];

  let nextIndex = tenantParam + 1;
  for (const token of query.predicateTokens) {
    params.push(`%${token}%`);
    clauses.push(
      `(f.predicate_key ILIKE $${String(nextIndex)} OR COALESCE(vt.value_text, '') ILIKE $${String(nextIndex)})`
    );
    nextIndex += 1;
  }

  if (query.yearHint != null) {
    const yearText = String(query.yearHint);
    params.push(`%${yearText}%`);
    const yearLikeParam = nextIndex;
    nextIndex += 1;
    params.push(query.yearHint);
    const yearIntParam = nextIndex;
    nextIndex += 1;
    params.push(`%${yearText}%`);
    const yearLikeParam2 = nextIndex;
    nextIndex += 1;
    clauses.push(
      `(f.predicate_key ILIKE $${String(yearLikeParam)} OR COALESCE(vt.value_text, '') ILIKE $${String(yearLikeParam)} OR EXTRACT(YEAR FROM vd.value_date)::int = $${String(yearIntParam)} OR COALESCE(vt.value_text, '') ILIKE $${String(yearLikeParam2)})`
    );
  }

  if (documentIds != null && documentIds.length > 0) {
    params.push(documentIds);
    clauses.push(`f.document_id = ANY($${String(nextIndex)}::uuid[])`);
  }

  return {
    whereSql: clauses.join(' AND '),
    params,
  };
}

const BASE_FROM = `
  FROM document_extracted_fact f
  INNER JOIN documents d ON d.id = f.document_id
  INNER JOIN document_extracted_fact_provenance p ON p.fact_id = f.id
  LEFT JOIN document_extracted_fact_value_text vt ON vt.fact_id = f.id
  LEFT JOIN document_extracted_fact_value_amount va ON va.fact_id = f.id
  LEFT JOIN document_extracted_fact_value_date vd ON vd.fact_id = f.id
`;

@Injectable()
export class PgExactFactQueryRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async lookupFacts(
    tenantId: string,
    query: ParsedExactFactQuery,
    documentIds: readonly string[] | undefined
  ): Promise<ExactFactRow[]> {
    const filters = buildQueryFilters(1, query, documentIds);
    const params = [tenantId, ...filters.params];
    const sql = `
      SELECT f.id AS fact_id,
             f.document_id,
             d.title AS document_title,
             f.kind,
             f.predicate_key,
             f.confidence,
             vt.value_text,
             va.amount_numeric::text AS amount_numeric,
             va.currency_code,
             vd.value_date,
             p.page,
             p.bbox_x,
             p.bbox_y,
             p.bbox_width,
             p.bbox_height,
             p.char_start,
             p.char_end
      ${BASE_FROM}
      WHERE ${filters.whereSql}
      ORDER BY f.confidence DESC, f.predicate_key ASC, f.id ASC
      LIMIT 20`;

    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<FactQueryRow>(sql, params);
      return result.rows.map(mapRow);
    });
  }

  async sumMatchingAmounts(
    tenantId: string,
    query: ParsedExactFactQuery,
    documentIds: readonly string[] | undefined
  ): Promise<{ total: number; currencyCode: string | null; factCount: number } | null> {
    const filters = buildQueryFilters(1, query, documentIds);
    const params = [tenantId, ...filters.params];
    const sql = `
      SELECT COALESCE(SUM(va.amount_numeric), 0)::text AS total,
             MIN(va.currency_code) AS currency_code,
             COUNT(*)::int AS fact_count
      ${BASE_FROM}
      WHERE ${filters.whereSql}
        AND f.kind = 'amount'
        AND va.amount_numeric IS NOT NULL`;

    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{
        total: string;
        currency_code: string | null;
        fact_count: number;
      }>(sql, params);
      const row = result.rows.at(0);
      if (row == null || row.fact_count === 0) {
        return null;
      }
      const total = Number(row.total);
      if (!Number.isFinite(total)) {
        return null;
      }
      return {
        total,
        currencyCode: row.currency_code,
        factCount: row.fact_count,
      };
    });
  }

  async countMatchingFacts(
    tenantId: string,
    query: ParsedExactFactQuery,
    documentIds: readonly string[] | undefined
  ): Promise<number> {
    const filters = buildQueryFilters(1, query, documentIds);
    const params = [tenantId, ...filters.params];
    const sql = `
      SELECT COUNT(*)::int AS fact_count
      ${BASE_FROM}
      WHERE ${filters.whereSql}`;

    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{ fact_count: number }>(sql, params);
      return result.rows[0]?.fact_count ?? 0;
    });
  }

  async resolveChunkForSpan(
    tenantId: string,
    documentId: string,
    charStart: number | null,
    charEnd: number | null,
    page: number | null
  ): Promise<{ chunkId: string; charStart: number; charEnd: number; quoteFallback: string } | null> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      if (charStart != null && charEnd != null && charEnd > charStart) {
        const overlap = await client.query<{
          id: string;
          char_start: number | null;
          char_end: number | null;
          body: string;
        }>(
          `SELECT id, char_start, char_end, body
           FROM document_text_chunks
           WHERE document_id = $1
             AND char_start IS NOT NULL
             AND char_end IS NOT NULL
             AND char_start <= $3
             AND char_end >= $2
           ORDER BY (LEAST(char_end, $3) - GREATEST(char_start, $2)) DESC, chunk_index ASC
           LIMIT 1`,
          [documentId, charStart, charEnd]
        );
        const overlapHit = overlap.rows.at(0);
        if (overlapHit != null) {
          return {
            chunkId: overlapHit.id,
            charStart,
            charEnd,
            quoteFallback: overlapHit.body.slice(0, 240),
          };
        }
      }
      if (page != null) {
        const byPage = await client.query<{
          id: string;
          body: string;
          char_start: number | null;
          char_end: number | null;
        }>(
          `SELECT id, body, char_start, char_end
           FROM document_text_chunks
           WHERE document_id = $1 AND page = $2
           ORDER BY chunk_index ASC
           LIMIT 1`,
          [documentId, page]
        );
        const pageHit = byPage.rows.at(0);
        if (pageHit != null) {
          return {
            chunkId: pageHit.id,
            charStart: pageHit.char_start ?? 0,
            charEnd: pageHit.char_end ?? pageHit.body.length,
            quoteFallback: pageHit.body.slice(0, 240),
          };
        }
      }
      const anyChunk = await client.query<{
        id: string;
        body: string;
        char_start: number | null;
        char_end: number | null;
      }>(
        `SELECT id, body, char_start, char_end
         FROM document_text_chunks
         WHERE document_id = $1
         ORDER BY chunk_index ASC
         LIMIT 1`,
        [documentId]
      );
      const fallbackHit = anyChunk.rows.at(0);
      if (fallbackHit == null) {
        return null;
      }
      return {
        chunkId: fallbackHit.id,
        charStart: fallbackHit.char_start ?? 0,
        charEnd: fallbackHit.char_end ?? fallbackHit.body.length,
        quoteFallback: fallbackHit.body.slice(0, 240),
      };
    });
  }

  async loadDocumentQuoteSlice(
    tenantId: string,
    documentId: string,
    charStart: number | null,
    charEnd: number | null
  ): Promise<string | null> {
    if (charStart == null || charEnd == null || charEnd <= charStart) {
      return null;
    }
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{ extracted_text: string | null }>(
        `SELECT extracted_text FROM documents WHERE id = $1 AND user_id = $2`,
        [documentId, tenantId]
      );
      const text = result.rows[0]?.extracted_text;
      if (!text) {
        return null;
      }
      return text.slice(charStart, charEnd).trim();
    });
  }
}
