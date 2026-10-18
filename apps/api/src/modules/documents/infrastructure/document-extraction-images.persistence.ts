// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentExtractionImageDto } from '@docuvate/contracts';
import type pg from 'pg';

import {
  parseNumber,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';

type Db = pg.Pool | pg.PoolClient;

export async function insertDocumentExtractionImageRow(
  client: Db,
  documentId: string,
  position: number,
  row: Omit<DocumentExtractionImageDto, 'id'>,
  imageId: string,
  thumbnailStorageKey: string
): Promise<DocumentExtractionImageDto> {
  await client.query(
    `INSERT INTO document_extraction_images (
       id, document_id, position, page, x, y, width, height, kind, caption, thumbnail_storage_key
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      imageId,
      documentId,
      position,
      row.page,
      row.x,
      row.y,
      row.width,
      row.height,
      row.kind,
      row.caption ?? null,
      thumbnailStorageKey,
    ]
  );
  return { id: imageId, ...row };
}

export async function loadExtractionImagesForDocuments(
  client: Db,
  documentIds: string[]
): Promise<Map<string, DocumentExtractionImageDto[]>> {
  const out = new Map<string, DocumentExtractionImageDto[]>();
  if (documentIds.length === 0) {
    return out;
  }
  const result = await client.query(
    `SELECT id, document_id, page, x, y, width, height, kind, caption
     FROM document_extraction_images
     WHERE document_id = ANY($1::uuid[])
     ORDER BY document_id, position`,
    [documentIds]
  );
  for (const raw of result.rows) {
    const row = requireRecord(raw);
    const documentId = parseString(row.document_id);
    const kindRaw = parseString(row.kind);
    const kind = kindRaw === 'figure' ? 'figure' : 'embedded';
    const image: DocumentExtractionImageDto = {
      id: parseString(row.id),
      page: parseNumber(row.page),
      x: parseNumber(row.x),
      y: parseNumber(row.y),
      width: parseNumber(row.width),
      height: parseNumber(row.height),
      kind,
      caption: parseOptionalString(row.caption),
    };
    const list = out.get(documentId) ?? [];
    list.push(image);
    out.set(documentId, list);
  }
  return out;
}

export async function findExtractionImageThumbnailKey(
  client: Db,
  documentId: string,
  imageId: string,
  userId: string
): Promise<string | null> {
  const result = await client.query(
    `SELECT i.thumbnail_storage_key
     FROM document_extraction_images i
     JOIN documents d ON d.id = i.document_id
     WHERE i.id = $1 AND i.document_id = $2 AND d.user_id = $3`,
    [imageId, documentId, userId]
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = requireRecord(result.rows[0]);
  return parseString(row.thumbnail_storage_key);
}
