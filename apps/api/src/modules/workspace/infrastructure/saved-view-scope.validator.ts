// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CreateSavedDocumentViewRequest,
  UpdateSavedDocumentViewRequest,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  parseNumber,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

type FilterInput = Pick<
  CreateSavedDocumentViewRequest,
  'folderId' | 'fieldFilters' | 'tagIds' | 'visibility'
>;

@Injectable()
export class SavedViewScopeValidator {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async assertWritableFilters(userId: string, input: FilterInput): Promise<void> {
    const visibility = input.visibility ?? 'private';
    const tagIds = input.tagIds ?? [];
    const fieldFilters = input.fieldFilters ?? [];
    const hasScoped =
      input.folderId != null || fieldFilters.length > 0 || tagIds.length > 0;

    if (visibility === 'shared' && hasScoped) {
      throw new ValidationError(
        'Shared views cannot include folder, tag, or recognized-field filters'
      );
    }

    if (input.folderId != null) {
      await this.assertOwned('folders', input.folderId, userId, 'folder');
    }
    if (fieldFilters.length > 0) {
      const keys = [...new Set(fieldFilters.map((f) => f.fieldKey.trim()).filter(Boolean))];
      if (keys.length > 0) {
        const result = await this.pool.query(
          `SELECT COUNT(*)::int AS c FROM recognized_field_definitions
           WHERE user_id = $1 AND field_key = ANY($2::text[])`,
          [userId, keys]
        );
        const count = parseNumber(requireRecord(result.rows[0]).c, 0);
        if (count !== keys.length) {
          throw new ValidationError('One or more recognized field filters are invalid');
        }
      }
    }
    if (tagIds.length > 0) {
      const result = await this.pool.query(
        `SELECT COUNT(*)::int AS c FROM tags WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, tagIds]
      );
      const count = parseNumber(requireRecord(result.rows[0]).c, 0);
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
      fieldFilters: 'fieldFilters' in input ? input.fieldFilters : undefined,
      tagIds: 'tagIds' in input ? input.tagIds : undefined,
    });
  }

  private async assertOwned(
    table: 'folders',
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
