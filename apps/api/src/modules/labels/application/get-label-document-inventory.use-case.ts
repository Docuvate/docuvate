// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type DocumentStatus,
  type LabelDocumentInventoryResponseDto,
  type LabelInventoryDocument,
  summarizeLabelAssignmentInventory,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import {
  parseEnum,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { parseTagsJson } from '../../documents/infrastructure/document-row.mapper.js';

const READY_DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'uploaded',
  'queued',
  'extracting',
  'ready',
  'failed',
];

function countDocumentsByTag(documents: LabelInventoryDocument[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const doc of documents) {
    for (const tag of doc.tags) {
      if (tag.isInbox) continue;
      counts[tag.id] = (counts[tag.id] ?? 0) + 1;
    }
  }
  return counts;
}

@Injectable()
export class GetLabelDocumentInventoryUseCase {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async execute(userId: string): Promise<LabelDocumentInventoryResponseDto> {
    const result = await this.pool.query(
      `SELECT d.id, d.title, d.filename, d.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'is_inbox', t.is_inbox
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags_json
       FROM documents d
       LEFT JOIN document_tags dtag ON dtag.document_id = d.id
       LEFT JOIN tags t ON t.id = dtag.tag_id
       WHERE d.user_id = $1 AND d.status = 'ready'
       GROUP BY d.id`,
      [userId]
    );

    const documents: LabelInventoryDocument[] = result.rows.map((raw) => {
      const row = requireRecord(raw);
      const tags = parseTagsJson(row.tags_json).map((tag) => ({
        id: tag.id,
        isInbox: tag.isInbox,
      }));
      return {
        id: parseString(row.id),
        title: parseString(row.title),
        filename: parseString(row.filename),
        status: parseEnum(parseString(row.status), READY_DOCUMENT_STATUSES, 'ready'),
        tags,
      };
    });

    return {
      inventory: summarizeLabelAssignmentInventory(documents),
      documentCountByTagId: countDocumentsByTag(documents),
      documents,
    };
  }
}
