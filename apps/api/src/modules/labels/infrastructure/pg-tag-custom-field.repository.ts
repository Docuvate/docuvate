// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CustomFieldType } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { TagCustomFieldRepository } from '../../../shared/domain/ports.js';
import {
  parseEnum,
  parseNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { TagCustomFieldEntity } from '../domain/tag-custom-field.entity.js';

const CUSTOM_FIELD_TYPES: readonly CustomFieldType[] = ['text', 'date', 'number', 'currency'];

function mapRow(row: Record<string, unknown>): TagCustomFieldEntity {
  return {
    id: parseString(row.id),
    tagId: parseString(row.tag_id),
    userId: parseString(row.user_id),
    key: parseString(row.field_key),
    label: parseString(row.label),
    fieldType: parseEnum(row.field_type, CUSTOM_FIELD_TYPES, 'text'),
    sortOrder: parseNumber(row.sort_order, 0),
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
export class PgTagCustomFieldRepository implements TagCustomFieldRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listForTag(tagId: string, userId: string): Promise<TagCustomFieldEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM tag_custom_field_definitions
       WHERE tag_id = $1 AND user_id = $2
       ORDER BY sort_order ASC, label ASC`,
      [tagId, userId]
    );
    return result.rows.map((raw) => mapRow(requireRecord(raw)));
  }

  async listForUser(userId: string): Promise<TagCustomFieldEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM tag_custom_field_definitions
       WHERE user_id = $1
       ORDER BY tag_id, sort_order ASC, label ASC`,
      [userId]
    );
    return result.rows.map((raw) => mapRow(requireRecord(raw)));
  }

  async replaceForTag(
    tagId: string,
    userId: string,
    fields: { key: string; label: string; fieldType: CustomFieldType; sortOrder: number }[]
  ): Promise<TagCustomFieldEntity[]> {
    const tagCheck = await this.pool.query(`SELECT id FROM tags WHERE id = $1 AND user_id = $2`, [
      tagId,
      userId,
    ]);
    if (tagCheck.rows.length === 0) {
      throw new NotFoundError('Tag');
    }

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
      await client.query(
        `DELETE FROM tag_custom_field_definitions WHERE tag_id = $1 AND user_id = $2`,
        [tagId, userId]
      );
      for (const field of fields) {
        const key = normalizeKey(field.key);
        const label = field.label.trim();
        if (!label) {
          throw new ValidationError('Feldbezeichnung ist erforderlich');
        }
        await client.query(
          `INSERT INTO tag_custom_field_definitions
             (tag_id, user_id, field_key, label, field_type, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [tagId, userId, key, label, field.fieldType, field.sortOrder]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.listForTag(tagId, userId);
  }
}
