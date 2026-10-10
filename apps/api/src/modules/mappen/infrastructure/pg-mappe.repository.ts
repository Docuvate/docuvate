// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError } from '../../../shared/domain/errors.js';
import type { MappeEntity, MappeListItem, MappeRepository } from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseNumber,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function mapRow(row: Record<string, unknown>): MappeEntity {
  return {
    id: parseString(row.id),
    userId: parseString(row.user_id),
    name: parseString(row.name),
    color: parseOptionalString(row.color),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

function mapListRow(row: Record<string, unknown>): MappeListItem {
  return {
    ...mapRow(row),
    documentCount: parseNumber(row.document_count, 0),
    folderCount: parseNumber(row.folder_count, 0),
  };
}

@Injectable()
export class PgMappeRepository implements MappeRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listForUser(userId: string): Promise<MappeListItem[]> {
    const result = await this.pool.query(
      `SELECT m.*,
        (
          SELECT COUNT(DISTINCT d.id)::int
          FROM documents d
          WHERE d.user_id = m.user_id
            AND NOT EXISTS (
              SELECT 1 FROM document_stack_members sm
              WHERE sm.document_id = d.id AND sm.role = 'version'
            )
            AND (
              d.mappe_id = m.id
              OR EXISTS (
                SELECT 1 FROM folders df
                WHERE df.id = d.folder_id AND df.mappe_id = m.id AND df.user_id = m.user_id
              )
            )
        ) AS document_count,
        (
          SELECT COUNT(*)::int FROM folders f WHERE f.mappe_id = m.id AND f.user_id = m.user_id
        ) AS folder_count
       FROM mappen m
       WHERE m.user_id = $1
       ORDER BY m.name ASC`,
      [userId]
    );
    return result.rows.map((raw) => mapListRow(requireRecord(raw)));
  }

  async findByIdForUser(id: string, userId: string): Promise<MappeEntity | null> {
    const result = await this.pool.query(`SELECT * FROM mappen WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    const raw: unknown = result.rows[0];
    return raw ? mapRow(requireRecord(raw)) : null;
  }

  async create(
    id: string,
    userId: string,
    name: string,
    color: string | null
  ): Promise<MappeEntity> {
    const result = await this.pool.query(
      `INSERT INTO mappen (id, user_id, name, color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING *`,
      [id, userId, name.trim(), color]
    );
    return mapRow(requireRecord(result.rows[0]));
  }

  async update(
    id: string,
    userId: string,
    patch: { name?: string; color?: string | null }
  ): Promise<MappeEntity> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Mappe');

    const name = patch.name?.trim() ?? existing.name;
    const color = patch.color !== undefined ? patch.color : existing.color;

    const result = await this.pool.query(
      `UPDATE mappen SET name = $3, color = $4, updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, name, color]
    );
    return mapRow(requireRecord(result.rows[0]));
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.pool.query(`DELETE FROM mappen WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    if ((result.rowCount ?? 0) === 0) throw new NotFoundError('Mappe');
  }
}
