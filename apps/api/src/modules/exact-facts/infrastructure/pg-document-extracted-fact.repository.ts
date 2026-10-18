// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedFactDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

@Injectable()
export class PgDocumentExtractedFactRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async replaceForDocument(
    tenantId: string,
    documentId: string,
    facts: ExtractedFactDto[],
    wallTimeMs: number | null
  ): Promise<void> {
    await withTenantPgClient(this.pool, tenantId, async (client) => {
      await client.query('BEGIN');
      try {
        await client.query(
          `DELETE FROM document_extracted_fact WHERE document_id = $1 AND tenant_id = $2`,
          [documentId, tenantId]
        );
        await client.query(
          `DELETE FROM document_exact_fact_index WHERE document_id = $1 AND tenant_id = $2`,
          [documentId, tenantId]
        );
        for (const fact of facts) {
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO document_extracted_fact (
              tenant_id, document_id, kind, predicate_key, confidence,
              table_index, row_index, col_index
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING id`,
            [
              tenantId,
              documentId,
              fact.kind,
              fact.predicateKey,
              fact.confidence,
              fact.tableIndex ?? null,
              fact.rowIndex ?? null,
              fact.colIndex ?? null,
            ]
          );
          const factId = inserted.rows[0]?.id;
          if (!factId) {
            throw new Error('fact insert did not return id');
          }
          const prov = fact.provenance;
          await client.query(
            `INSERT INTO document_extracted_fact_provenance (
              fact_id, page, bbox_x, bbox_y, bbox_width, bbox_height, char_start, char_end
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              factId,
              prov.page,
              prov.x,
              prov.y,
              prov.width,
              prov.height,
              prov.charStart,
              prov.charEnd,
            ]
          );
          switch (fact.kind) {
            case 'key_value':
            case 'table_cell': {
              const valueText = fact.valueText ?? '';
              await client.query(
                `INSERT INTO document_extracted_fact_value_text (fact_id, value_text) VALUES ($1,$2)`,
                [factId, valueText]
              );
              break;
            }
            case 'amount': {
              if (fact.amountNumeric == null) {
                throw new Error('amount fact missing amountNumeric');
              }
              await client.query(
                `INSERT INTO document_extracted_fact_value_amount (fact_id, amount_numeric, currency_code)
                 VALUES ($1,$2,$3)`,
                [factId, fact.amountNumeric, fact.currencyCode ?? null]
              );
              break;
            }
            case 'date': {
              if (!fact.valueDateIso) {
                throw new Error('date fact missing valueDateIso');
              }
              await client.query(
                `INSERT INTO document_extracted_fact_value_date (fact_id, value_date) VALUES ($1,$2)`,
                [factId, fact.valueDateIso]
              );
              break;
            }
            default: {
              const _exhaustive: never = fact.kind;
              throw new Error(`unsupported fact kind: ${String(_exhaustive)}`);
            }
          }
        }
        await client.query(
          `INSERT INTO document_exact_fact_index (document_id, tenant_id, fact_count, wall_time_ms, indexed_at)
           VALUES ($1,$2,$3,$4,now())`,
          [documentId, tenantId, facts.length, wallTimeMs]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }

  async listDocumentIdsMissingIndex(tenantId: string, limit: number): Promise<string[]> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{ id: string }>(
        `SELECT d.id
         FROM documents d
         LEFT JOIN document_exact_fact_index idx ON idx.document_id = d.id
         WHERE d.user_id = $1
           AND d.status = 'ready'
           AND idx.document_id IS NULL
         ORDER BY d.created_at, d.id
         LIMIT $2`,
        [tenantId, limit]
      );
      return result.rows.map((row) => row.id);
    });
  }
}
