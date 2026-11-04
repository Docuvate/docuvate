// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import type { FieldFeedbackPosition } from '../../../shared/domain/ports.js';
import {
  parseEnum,
  parseNumber,
  parseNumberArray,
  parseOptionalNumber,
  parseOptionalString,
} from '../../../shared/domain/row-parse.js';

type PositionOwner = { confirmationId: string } | { correctionId: string };

const POSITION_SOURCES = ['model_fact', 'user_region'] as const;

/** Replaces the stored position of one feedback row (none when `position` is null). */
export async function replaceFeedbackPosition(
  client: pg.PoolClient,
  owner: PositionOwner,
  position: FieldFeedbackPosition | null
): Promise<void> {
  const confirmationId = 'confirmationId' in owner ? owner.confirmationId : null;
  const correctionId = 'correctionId' in owner ? owner.correctionId : null;
  await client.query(
    `DELETE FROM extraction_field_feedback_positions
     WHERE confirmation_id = $1 OR correction_id = $2`,
    [confirmationId, correctionId]
  );
  if (!position) {
    return;
  }
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO extraction_field_feedback_positions (
       confirmation_id, correction_id, source, page,
       doc_char_start, doc_char_end, x0, y0, x1, y1
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      confirmationId,
      correctionId,
      position.source,
      position.page,
      position.docCharStart,
      position.docCharEnd,
      position.bbox?.x0 ?? null,
      position.bbox?.y0 ?? null,
      position.bbox?.x1 ?? null,
      position.bbox?.y1 ?? null,
    ]
  );
  const positionId = inserted.rows[0]?.id;
  if (!positionId || position.blockIndexes.length === 0) {
    return;
  }
  await client.query(
    `INSERT INTO extraction_field_feedback_position_tokens (position_id, block_index)
     SELECT $1, block_index FROM unnest($2::int[]) AS block_index
     ON CONFLICT DO NOTHING`,
    [positionId, [...position.blockIndexes]]
  );
}

/** Maps the `position_*` columns selected by the training export query. */
export function mapFeedbackPosition(row: Record<string, unknown>): FieldFeedbackPosition | null {
  if (parseOptionalString(row.position_id) === null) {
    return null;
  }
  const x0 = parseOptionalNumber(row.position_x0);
  const y0 = parseOptionalNumber(row.position_y0);
  const x1 = parseOptionalNumber(row.position_x1);
  const y1 = parseOptionalNumber(row.position_y1);
  return {
    source: parseEnum(row.position_source, POSITION_SOURCES, 'model_fact'),
    page: parseNumber(row.position_page, 1),
    docCharStart: parseOptionalNumber(row.position_doc_char_start),
    docCharEnd: parseOptionalNumber(row.position_doc_char_end),
    bbox: x0 !== null && y0 !== null && x1 !== null && y1 !== null ? { x0, y0, x1, y1 } : null,
    blockIndexes: parseNumberArray(row.position_block_indexes),
  };
}
