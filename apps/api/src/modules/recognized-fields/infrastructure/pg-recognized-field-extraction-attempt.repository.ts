// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { RecognizedFieldExtractionOutcome } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  parseDate,
  parseEnum,
  parseOptionalNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { RECOGNIZED_FIELD_EXTRACTOR_VERSION } from '../domain/recognized-field-reextract-config.js';

const OUTCOMES: readonly RecognizedFieldExtractionOutcome[] = [
  'not_applicable',
  'pending',
  'not_found',
  'below_threshold',
  'found',
];

export interface RecognizedFieldExtractionAttemptRow {
  fieldDefinitionId: string;
  fieldKey: string;
  outcome: RecognizedFieldExtractionOutcome;
  confidence: number | null;
  extractorVersion: number;
  updatedAt: Date;
}

function mapRow(row: Record<string, unknown>): RecognizedFieldExtractionAttemptRow {
  return {
    fieldDefinitionId: parseString(row.field_definition_id),
    fieldKey: parseString(row.field_key),
    outcome: parseEnum(row.outcome, OUTCOMES, 'not_found'),
    confidence: parseOptionalNumber(row.confidence),
    extractorVersion: parseOptionalNumber(row.extractor_version) ?? 0,
    updatedAt: parseDate(row.updated_at),
  };
}

@Injectable()
export class PgRecognizedFieldExtractionAttemptRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listForDocument(documentId: string, userId: string): Promise<RecognizedFieldExtractionAttemptRow[]> {
    const result = await this.pool.query(
      `SELECT a.field_definition_id, a.outcome, a.confidence, a.extractor_version, a.updated_at, r.field_key
       FROM document_recognized_field_extraction_attempt a
       JOIN recognized_field_definitions r ON r.id = a.field_definition_id
       WHERE a.document_id = $1 AND a.tenant_id = $2
       ORDER BY r.sort_order ASC, r.label ASC`,
      [documentId, userId]
    );
    return result.rows.map((raw) => mapRow(requireRecord(raw)));
  }

  async upsertMany(
    userId: string,
    rows: {
      documentId: string;
      fieldDefinitionId: string;
      outcome: RecognizedFieldExtractionOutcome;
      confidence: number | null;
    }[]
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        await client.query(
          `INSERT INTO document_recognized_field_extraction_attempt
             (document_id, field_definition_id, tenant_id, outcome, confidence, extractor_version, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, now())
           ON CONFLICT (document_id, field_definition_id) DO UPDATE SET
             outcome = EXCLUDED.outcome,
             confidence = EXCLUDED.confidence,
             extractor_version = EXCLUDED.extractor_version,
             updated_at = now()`,
          [
            row.documentId,
            row.fieldDefinitionId,
            userId,
            row.outcome,
            row.confidence,
            RECOGNIZED_FIELD_EXTRACTOR_VERSION,
          ]
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

  async listDocumentIdsMissingAttempts(
    userId: string,
    field: {
      id: string;
      key: string;
      extractForAllDocuments: boolean;
      gateLabelIds: string[];
      gateLabelMatch: 'any' | 'all';
      minLabelConfidence: number | null;
      confidenceGateEnabled: boolean | null;
    },
    prefs: {
      fieldExtractionConfidenceGateEnabled: boolean;
      labelFieldConfidenceThreshold: number;
    },
    limit: number
  ): Promise<string[]> {
    const ids = await this.listDocumentIdsForFieldReextraction(userId, field, prefs, limit);
    if (ids.length === 0) {
      return [];
    }
    const globalKey = `global:${field.key}`;
    const result = await this.pool.query<{ id: string }>(
      `SELECT d.id
       FROM documents d
       WHERE d.user_id = $1
         AND d.id = ANY($2::uuid[])
         AND NOT EXISTS (
           SELECT 1
           FROM extraction_field_corrections c
           WHERE c.user_id = $1
             AND c.document_id = d.id
             AND c.field_key IN ($4, $5)
         )
         AND (
           NOT EXISTS (
             SELECT 1
             FROM document_recognized_field_extraction_attempt a
             WHERE a.document_id = d.id
               AND a.field_definition_id = $3
               AND a.tenant_id = $1
           )
           OR EXISTS (
             SELECT 1
             FROM document_recognized_field_extraction_attempt a
             WHERE a.document_id = d.id
               AND a.field_definition_id = $3
               AND a.tenant_id = $1
               AND a.outcome IN ('not_found', 'below_threshold')
               AND coalesce(a.extractor_version, 0) < $6
           )
         )`,
      [userId, ids, field.id, globalKey, field.key, RECOGNIZED_FIELD_EXTRACTOR_VERSION]
    );
    return result.rows.map((row) => parseString(requireRecord(row).id));
  }

  async listDocumentIdsForFieldReextraction(
    userId: string,
    field: {
      id: string;
      extractForAllDocuments: boolean;
      gateLabelIds: string[];
      gateLabelMatch: 'any' | 'all';
      minLabelConfidence: number | null;
      confidenceGateEnabled: boolean | null;
    },
    prefs: {
      fieldExtractionConfidenceGateEnabled: boolean;
      labelFieldConfidenceThreshold: number;
    },
    limit: number
  ): Promise<string[]> {
    const capped = Math.min(Math.max(limit, 1), 5000);
    const confidenceGateEnabled =
      field.confidenceGateEnabled ?? prefs.fieldExtractionConfidenceGateEnabled;
    const minConfidence = field.minLabelConfidence ?? prefs.labelFieldConfidenceThreshold;

    if (field.extractForAllDocuments) {
      const result = await this.pool.query<{ id: string }>(
        `SELECT d.id
         FROM documents d
         WHERE d.user_id = $1
           AND trim(coalesce(d.extracted_text, '')) <> ''
           AND d.status IN ('ready', 'failed')
         ORDER BY d.updated_at DESC
         LIMIT $2`,
        [userId, capped]
      );
      return result.rows.map((row) => parseString(requireRecord(row).id));
    }

    if (field.gateLabelIds.length === 0) {
      return [];
    }

    const gateIds = field.gateLabelIds;
    const matchAll = field.gateLabelMatch === 'all';

    if (matchAll) {
      const result = await this.pool.query<{ id: string }>(
        `SELECT d.id
         FROM documents d
         WHERE d.user_id = $1
           AND trim(coalesce(d.extracted_text, '')) <> ''
           AND d.status IN ('ready', 'failed')
           AND (
             SELECT count(DISTINCT dt.tag_id)
             FROM document_tags dt
             WHERE dt.document_id = d.id AND dt.tag_id::text = ANY($2::text[])
           ) = $3
         ORDER BY d.updated_at DESC
         LIMIT $4`,
        [userId, gateIds, gateIds.length, capped]
      );
      return result.rows.map((row) => parseString(requireRecord(row).id));
    }

    if (confidenceGateEnabled) {
      const result = await this.pool.query<{ id: string }>(
        `SELECT sub.id
         FROM (
           SELECT DISTINCT d.id, d.updated_at
           FROM documents d
           WHERE d.user_id = $1
             AND trim(coalesce(d.extracted_text, '')) <> ''
             AND d.status IN ('ready', 'failed')
             AND (
               EXISTS (
                 SELECT 1 FROM document_tags dt
                 JOIN tags t ON t.id = dt.tag_id
                 WHERE dt.document_id = d.id
                   AND dt.tag_id::text = ANY($2::text[])
                   AND t.is_inbox = false
               )
               OR EXISTS (
                 SELECT 1 FROM document_tag_suggestions s
                 JOIN tags t ON t.id = s.tag_id
                 WHERE s.document_id = d.id
                   AND NOT s.dismissed
                   AND s.tag_id::text = ANY($2::text[])
                   AND t.is_inbox = false
                   AND coalesce(s.confidence, 0) >= $3
               )
             )
         ) sub
         ORDER BY sub.updated_at DESC
         LIMIT $4`,
        [userId, gateIds, minConfidence, capped]
      );
      return result.rows.map((row) => parseString(requireRecord(row).id));
    }

    const result = await this.pool.query<{ id: string }>(
      `SELECT sub.id
       FROM (
         SELECT DISTINCT d.id, d.updated_at
         FROM documents d
         WHERE d.user_id = $1
           AND trim(coalesce(d.extracted_text, '')) <> ''
           AND d.status IN ('ready', 'failed')
           AND EXISTS (
             SELECT 1 FROM document_tags dt
             WHERE dt.document_id = d.id AND dt.tag_id::text = ANY($2::text[])
           )
       ) sub
       ORDER BY sub.updated_at DESC
       LIMIT $3`,
      [userId, gateIds, capped]
    );
    return result.rows.map((row) => parseString(requireRecord(row).id));
  }
}
