// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  DOCUMENT_ENCODER_ID,
  DOCUMENT_ENCODER_REVISION,
} from '../../../shared/domain/document-encoder.js';
import { parseNumber, parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

export interface EncoderReindexProgress {
  targetEncoderId: string;
  targetEncoderRevision: string;
  staleCount: number;
  readyDocumentCount: number;
}

@Injectable()
export class PgEncoderReindexRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listTenantIdsWithStaleRepresentations(limit: number): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT d.user_id
       FROM documents d
       INNER JOIN document_representation dr ON dr.document_id = d.id
       WHERE d.status = 'ready'
         AND length(trim(coalesce(d.extracted_text, ''))) >= 20
         AND (
           dr.encoder_id IS DISTINCT FROM $1
           OR dr.encoder_revision IS DISTINCT FROM $2
         )
       LIMIT $3`,
      [DOCUMENT_ENCODER_ID, DOCUMENT_ENCODER_REVISION, limit]
    );
    return result.rows.map((raw) => parseString(requireRecord(raw).user_id));
  }

  async listStaleDocumentIdsForTenant(tenantId: string, limit: number): Promise<string[]> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query(
        `SELECT d.id
         FROM documents d
         INNER JOIN document_representation dr ON dr.document_id = d.id
         WHERE d.user_id = $1
           AND d.status = 'ready'
           AND length(trim(coalesce(d.extracted_text, ''))) >= 20
           AND (
             dr.encoder_id IS DISTINCT FROM $2
             OR dr.encoder_revision IS DISTINCT FROM $3
           )
         ORDER BY d.updated_at ASC
         LIMIT $4`,
        [tenantId, DOCUMENT_ENCODER_ID, DOCUMENT_ENCODER_REVISION, limit]
      );
      return result.rows.map((raw) => parseString(requireRecord(raw).id));
    });
  }

  async progressForTenant(tenantId: string): Promise<EncoderReindexProgress> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query(
        `SELECT
           COUNT(*) FILTER (
             WHERE dr.document_id IS NOT NULL
               AND (
                 dr.encoder_id IS DISTINCT FROM $2
                 OR dr.encoder_revision IS DISTINCT FROM $3
               )
           )::int AS stale_count,
           COUNT(*) FILTER (
             WHERE length(trim(coalesce(d.extracted_text, ''))) >= 20
           )::int AS ready_count
         FROM documents d
         LEFT JOIN document_representation dr ON dr.document_id = d.id
         WHERE d.user_id = $1
           AND d.status = 'ready'`,
        [tenantId, DOCUMENT_ENCODER_ID, DOCUMENT_ENCODER_REVISION]
      );
      const row = requireRecord(result.rows[0]);
      return {
        targetEncoderId: DOCUMENT_ENCODER_ID,
        targetEncoderRevision: DOCUMENT_ENCODER_REVISION,
        staleCount: parseNumber(row.stale_count, 0),
        readyDocumentCount: parseNumber(row.ready_count, 0),
      };
    });
  }
}
