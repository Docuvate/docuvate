// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES, errorCodeI18nKey } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import type {
  FolderEntity,
  FolderListItem,
  FolderRepository,
} from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseNumber,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === '23505';
}

function mapRow(row: Record<string, unknown>): FolderEntity {
  return {
    id: parseString(row.id),
    userId: parseString(row.user_id),
    name: parseString(row.name),
    parentId: parseOptionalString(row.parent_id),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

@Injectable()
export class PgFolderRepository implements FolderRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listForUser(userId: string): Promise<FolderListItem[]> {
    const result = await this.pool.query(
      `SELECT f.*, COUNT(d.id)::int AS document_count
       FROM folders f
       LEFT JOIN documents d ON d.folder_id = f.id AND d.user_id = f.user_id
         AND NOT EXISTS (
           SELECT 1 FROM document_stack_members sm
           WHERE sm.document_id = d.id AND sm.role = 'version'
         )
       WHERE f.user_id = $1
       GROUP BY f.id
       ORDER BY f.name ASC`,
      [userId]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        ...mapRow(row),
        documentCount: parseNumber(row.document_count, 0),
      };
    });
  }

  async findByIdForUser(id: string, userId: string): Promise<FolderEntity | null> {
    const result = await this.pool.query(`SELECT * FROM folders WHERE id = $1 AND user_id = $2`, [
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
    parentId: string | null
  ): Promise<FolderEntity> {
    try {
      const result = await this.pool.query(
        `INSERT INTO folders (id, user_id, name, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING *`,
        [id, userId, name.trim(), parentId]
      );
      return mapRow(requireRecord(result.rows[0]));
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(
          errorCodeI18nKey(ERROR_CODES.FOLDER_NAME_CONFLICT),
          ERROR_CODES.FOLDER_NAME_CONFLICT
        );
      }
      throw err;
    }
  }

  async update(
    id: string,
    userId: string,
    patch: { name?: string; parentId?: string | null }
  ): Promise<FolderEntity> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Folder');

    const name = patch.name?.trim() ?? existing.name;
    const parentId = patch.parentId !== undefined ? patch.parentId : existing.parentId;

    try {
      const result = await this.pool.query(
        `UPDATE folders SET name = $3, parent_id = $4, updated_at = now()
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId, name, parentId]
      );
      return mapRow(requireRecord(result.rows[0]));
    } catch (err: unknown) {
      if (isUniqueViolation(err)) {
        throw new ConflictError(
          errorCodeI18nKey(ERROR_CODES.FOLDER_NAME_CONFLICT),
          ERROR_CODES.FOLDER_NAME_CONFLICT
        );
      }
      throw err;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.pool.query(`DELETE FROM folders WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    if ((result.rowCount ?? 0) === 0) throw new NotFoundError('Folder');
  }
}
