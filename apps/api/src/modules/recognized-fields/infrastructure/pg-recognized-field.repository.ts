// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType, RecognizedFieldLabelGateMatch } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { ValidationError } from '../../../shared/domain/errors.js';
import type { RecognizedFieldRepository } from '../../../shared/domain/ports.js';
import {
  parseBoolean,
  parseEnum,
  parseNumber,
  parseOptionalNumber,
  parseString,
  parseStringArray,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { RecognizedFieldEntity } from '../domain/recognized-field.entity.js';

const CUSTOM_FIELD_TYPES: readonly CustomFieldType[] = ['text', 'date', 'number', 'currency'];
const GATE_LABEL_MATCHES: readonly RecognizedFieldLabelGateMatch[] = ['any', 'all'];

function mapRow(row: Record<string, unknown>): RecognizedFieldEntity {
  return {
    id: parseString(row.id),
    userId: parseString(row.user_id),
    key: parseString(row.field_key),
    label: parseString(row.label),
    fieldType: parseEnum(row.field_type, CUSTOM_FIELD_TYPES, 'text'),
    sortOrder: parseNumber(row.sort_order, 0),
    extractForAllDocuments: parseBoolean(row.extract_for_all_documents),
    gateLabelIds: parseStringArray(row.gate_label_ids),
    gateLabelMatch: parseEnum(row.gate_label_match, GATE_LABEL_MATCHES, 'all'),
    minLabelConfidence: parseOptionalNumber(row.min_label_confidence),
    confidenceGateEnabled:
      row.confidence_gate_enabled === null || row.confidence_gate_enabled === undefined
        ? null
        : parseBoolean(row.confidence_gate_enabled),
  };
}

function normalizeKey(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const slug = trimmed
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  if (!slug) {
    throw new ValidationError('Feldschlüssel ist ungültig');
  }
  return slug;
}

@Injectable()
export class PgRecognizedFieldRepository implements RecognizedFieldRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listForUser(userId: string): Promise<RecognizedFieldEntity[]> {
    const result = await this.pool.query(
      `SELECT r.*,
         COALESCE(
           (
             SELECT array_agg(g.tag_id::text ORDER BY g.tag_id)
             FROM recognized_field_definition_gate_labels g
             WHERE g.field_definition_id = r.id
           ),
           ARRAY[]::text[]
         ) AS gate_label_ids
       FROM recognized_field_definitions r
       WHERE r.user_id = $1
       ORDER BY r.sort_order ASC, r.label ASC`,
      [userId]
    );
    return result.rows.map((raw) => mapRow(requireRecord(raw)));
  }

  async replaceForUser(
    userId: string,
    fields: {
      key: string;
      label: string;
      fieldType: CustomFieldType;
      sortOrder: number;
      extractForAllDocuments: boolean;
      gateLabelIds: string[];
      gateLabelMatch: RecognizedFieldLabelGateMatch;
      minLabelConfidence: number | null;
      confidenceGateEnabled: boolean | null;
    }[]
  ): Promise<RecognizedFieldEntity[]> {
    const seen = new Set<string>();
    for (const field of fields) {
      const key = normalizeKey(field.key);
      if (seen.has(key)) {
        throw new ValidationError(`Doppelter Feldschlüssel „${key}"`);
      }
      seen.add(key);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM recognized_field_definitions WHERE user_id = $1`, [userId]);
      for (const field of fields) {
        const key = normalizeKey(field.key);
        const label = field.label.trim();
        if (!label) {
          throw new ValidationError('Feldbezeichnung ist erforderlich');
        }
        const gateLabelIds = [...new Set(field.gateLabelIds)];
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO recognized_field_definitions
             (user_id, field_key, label, field_type, sort_order, extract_for_all_documents,
              gate_label_match, min_label_confidence, confidence_gate_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            userId,
            key,
            label,
            field.fieldType,
            field.sortOrder,
            field.extractForAllDocuments,
            field.gateLabelMatch,
            field.minLabelConfidence,
            field.confidenceGateEnabled,
          ]
        );
        const definitionId = parseString(inserted.rows[0]?.id);
        if (gateLabelIds.length > 0) {
          await client.query(
            `INSERT INTO recognized_field_definition_gate_labels (field_definition_id, tag_id)
             SELECT $1, t.id FROM tags t
             WHERE t.user_id = $2 AND t.id::text = ANY($3::text[])
             ON CONFLICT DO NOTHING`,
            [definitionId, userId, gateLabelIds]
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

    return this.listForUser(userId);
  }
}
