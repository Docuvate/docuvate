// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type {
  CreateSavedDocumentViewRequest,
  UpdateSavedDocumentViewRequest,
} from '@docuvate/contracts';
import { ValidationError } from '../../../shared/domain/errors.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

type FilterInput = Pick<
  CreateSavedDocumentViewRequest,
  'folderId' | 'mappeId' | 'correspondentId' | 'tagIds' | 'visibility'
>;

@Injectable()
export class SavedViewScopeValidator {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async assertWritableFilters(userId: string, input: FilterInput): Promise<void> {
    const visibility = input.visibility ?? 'private';
    const tagIds = input.tagIds ?? [];
    const hasScoped =
      input.folderId != null ||
      input.mappeId != null ||
      input.correspondentId != null ||
      tagIds.length > 0;

    if (visibility === 'shared' && hasScoped) {
      throw new ValidationError(
        'Shared views cannot include folder, tag, or correspondent filters'
      );
    }

    if (input.folderId != null) {
      await this.assertOwned('folders', input.folderId, userId, 'folder');
    }
    if (input.mappeId != null) {
      await this.assertOwned('mappen', input.mappeId, userId, 'mappe');
    }
    if (input.correspondentId != null) {
      await this.assertOwned('correspondents', input.correspondentId, userId, 'correspondent');
    }
    if (tagIds.length > 0) {
      const result = await this.pool.query(
        `SELECT COUNT(*)::int AS c FROM tags WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, tagIds]
      );
      const count = Number(result.rows[0]?.['c'] ?? 0);
      if (count !== tagIds.length) {
        throw new ValidationError('One or more tags are not in your library');
      }
    }
  }

  async assertUpdateFilters(
    userId: string,
    visibility: 'private' | 'shared',
    input: UpdateSavedDocumentViewRequest
  ): Promise<void> {
    await this.assertWritableFilters(userId, {
      visibility,
      folderId: 'folderId' in input ? input.folderId : undefined,
      mappeId: 'mappeId' in input ? input.mappeId : undefined,
      correspondentId: 'correspondentId' in input ? input.correspondentId : undefined,
      tagIds: 'tagIds' in input ? input.tagIds : undefined,
    });
  }

  private async assertOwned(
    table: 'folders' | 'mappen' | 'correspondents',
    id: string,
    userId: string,
    label: string
  ): Promise<void> {
    const result = await this.pool.query(
      `SELECT 1 FROM ${table} WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [id, userId]
    );
    if ((result.rowCount ?? 0) === 0) {
      throw new ValidationError(`Unknown or inaccessible ${label}`);
    }
  }
}
