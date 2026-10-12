// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { withTenantPgClient } from '../../../shared/infrastructure/database/tenant-pg.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

export interface PersistedRepresentationUnit {
  unitIndex: number;
  kind: string;
  body: string;
  page: number | null;
  bboxX: number | null;
  bboxY: number | null;
  bboxWidth: number | null;
  bboxHeight: number | null;
  charStart: number | null;
  charEnd: number | null;
  vectorScale: number;
  vectorInt8: Buffer;
  binaryCode: Buffer;
}

export interface DocumentRepresentationPayload {
  encoderId: string;
  encoderRevision: string;
  representationVersion: number;
  documentMeanScale: number;
  documentMeanInt8: Buffer;
  documentMaxScale: number;
  documentMaxInt8: Buffer;
  units: PersistedRepresentationUnit[];
}

@Injectable()
export class PgDocumentRepresentationRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async replaceForDocument(
    tenantId: string,
    documentId: string,
    payload: DocumentRepresentationPayload
  ): Promise<void> {
    await withTenantPgClient(this.pool, tenantId, async (client) => {
      await client.query(`DELETE FROM document_representation_unit WHERE document_id = $1`, [
        documentId,
      ]);
      await client.query(`DELETE FROM document_representation WHERE document_id = $1`, [documentId]);
      await client.query(
        `INSERT INTO document_representation (
          document_id, tenant_id, encoder_id, encoder_revision, representation_version,
          document_mean_scale, document_mean_int8, document_max_scale, document_max_int8, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`,
        [
          documentId,
          tenantId,
          payload.encoderId,
          payload.encoderRevision,
          payload.representationVersion,
          payload.documentMeanScale,
          payload.documentMeanInt8,
          payload.documentMaxScale,
          payload.documentMaxInt8,
        ]
      );
      for (const unit of payload.units) {
        await client.query(
          `INSERT INTO document_representation_unit (
            document_id, tenant_id, unit_index, kind, body, page,
            bbox_x, bbox_y, bbox_width, bbox_height, char_start, char_end,
            vector_scale, vector_int8, binary_code
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            documentId,
            tenantId,
            unit.unitIndex,
            unit.kind,
            unit.body,
            unit.page,
            unit.bboxX,
            unit.bboxY,
            unit.bboxWidth,
            unit.bboxHeight,
            unit.charStart,
            unit.charEnd,
            unit.vectorScale,
            unit.vectorInt8,
            unit.binaryCode,
          ]
        );
      }
    });
  }

  async loadDocumentMeanVector(
    tenantId: string,
    documentId: string
  ): Promise<{ model: string; vector: number[] } | null> {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{
        encoder_id: string;
        document_mean_scale: number;
        document_mean_int8: Buffer;
      }>(
        `SELECT encoder_id, document_mean_scale, document_mean_int8
         FROM document_representation WHERE document_id = $1`,
        [documentId]
      );
      if (result.rowCount === 0) {
        return null;
      }
      const row = result.rows[0];
      const raw = row.document_mean_int8;
      const scale = row.document_mean_scale;
      const vector: number[] = [];
      for (let i = 0; i < raw.length; i += 1) {
        vector.push(raw.readInt8(i) * scale);
      }
      return { model: row.encoder_id, vector };
    });
  }

  async listUnitVectorsForDocument(
    tenantId: string,
    documentId: string
  ): Promise<
    {
      unitIndex: number;
      body: string;
      page: number | null;
      charStart: number | null;
      charEnd: number | null;
      vectorScale: number;
      vectorInt8: Buffer;
      binaryCode: Buffer;
    }[]
  > {
    return withTenantPgClient(this.pool, tenantId, async (client) => {
      const result = await client.query<{
        unit_index: number;
        body: string;
        page: number | null;
        char_start: number | null;
        char_end: number | null;
        vector_scale: number;
        vector_int8: Buffer;
        binary_code: Buffer;
      }>(
        `SELECT unit_index, body, page, char_start, char_end, vector_scale, vector_int8, binary_code
         FROM document_representation_unit
         WHERE document_id = $1
         ORDER BY unit_index ASC`,
        [documentId]
      );
      return result.rows.map((row) => ({
        unitIndex: row.unit_index,
        body: row.body,
        page: row.page,
        charStart: row.char_start,
        charEnd: row.char_end,
        vectorScale: row.vector_scale,
        vectorInt8: row.vector_int8,
        binaryCode: row.binary_code,
      }));
    });
  }
}
