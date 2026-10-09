// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type {
  FolderRepository,
  FolderEntity,
  FolderListItem,
} from '../../../shared/domain/ports.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

function mapRow(row: Record<string, unknown>): FolderEntity {
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    name: String(row['name']),
    parentId: row['parent_id'] != null ? String(row['parent_id']) : null,
    mappeId: row['mappe_id'] != null ? String(row['mappe_id']) : null,
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'])),
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
    return result.rows.map((row) => ({
      ...mapRow(row),
      documentCount: Number(row['document_count'] ?? 0),
    }));
  }

  async findByIdForUser(id: string, userId: string): Promise<FolderEntity | null> {
    const result = await this.pool.query(`SELECT * FROM folders WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async create(
    id: string,
    userId: string,
    name: string,
    parentId: string | null,
    mappeId: string | null
  ): Promise<FolderEntity> {
    const result = await this.pool.query(
      `INSERT INTO folders (id, user_id, name, parent_id, mappe_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       RETURNING *`,
      [id, userId, name.trim(), parentId, mappeId]
    );
    return mapRow(result.rows[0]!);
  }

  async update(
    id: string,
    userId: string,
    patch: { name?: string; parentId?: string | null; mappeId?: string | null }
  ): Promise<FolderEntity> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Folder');

    const name = patch.name?.trim() ?? existing.name;
    const parentId = patch.parentId !== undefined ? patch.parentId : existing.parentId;
    const mappeId = patch.mappeId !== undefined ? patch.mappeId : existing.mappeId;

    const result = await this.pool.query(
      `UPDATE folders SET name = $3, parent_id = $4, mappe_id = $5, updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, name, parentId, mappeId]
    );
    return mapRow(result.rows[0]!);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.pool.query(`DELETE FROM folders WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    if ((result.rowCount ?? 0) === 0) throw new NotFoundError('Folder');
  }
}
