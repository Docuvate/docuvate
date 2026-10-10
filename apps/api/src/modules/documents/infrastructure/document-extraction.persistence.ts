// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ExtractedField,type ExtractionBlock, suggestionStorageKey } from '@docuvate/contracts';
import type pg from 'pg';

import {
  parseNumber,
  parseOptionalNumber,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import {
  loadDocumentFieldValues,
  replaceDocumentFieldValues,
} from '../../search/infrastructure/document-field-value-index.js';

type Db = pg.Pool | pg.PoolClient;

export function mergeExtractionFieldRows(
  fields: ExtractedField[],
  fieldSuggestions: { key: string; value: string; confidence?: number }[] = []
): ExtractedField[] {
  const rows = [...fields];
  for (const suggestion of fieldSuggestions) {
    const semantic = suggestion.key.trim().toLowerCase();
    const value = suggestion.value.trim();
    if (!semantic || !value) continue;
    rows.push({
      key: suggestionStorageKey(semantic),
      value,
      confidence: suggestion.confidence ?? 0.45,
    });
  }
  return rows;
}

/** Replaces all field values of a document (extraction result or user edit). */
export async function replaceDocumentExtractionFields(
  client: Db,
  documentId: string,
  userId: string,
  fields: ExtractedField[]
): Promise<void> {
  await replaceDocumentFieldValues(client, documentId, userId, fields);
}

/** Replaces all layout blocks of a document, keeping their order. */
export async function replaceDocumentExtractionBlocks(
  client: Db,
  documentId: string,
  blocks: ExtractionBlock[]
): Promise<void> {
  await client.query(`DELETE FROM document_extraction_blocks WHERE document_id = $1`, [documentId]);
  for (const [position, block] of blocks.entries()) {
    await client.query(
      `INSERT INTO document_extraction_blocks (
         document_id, position, page, block_index, x, y, width, height, text
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        documentId,
        position,
        block.page,
        block.blockIndex ?? null,
        block.x,
        block.y,
        block.width,
        block.height,
        block.text,
      ]
    );
  }
}

async function loadBlocks(
  client: Db,
  documentIds: string[]
): Promise<Map<string, ExtractionBlock[]>> {
  const out = new Map<string, ExtractionBlock[]>();
  if (documentIds.length === 0) return out;
  const result = await client.query(
    `SELECT document_id, page, block_index, x, y, width, height, text
     FROM document_extraction_blocks
     WHERE document_id = ANY($1::uuid[])
     ORDER BY document_id, position`,
    [documentIds]
  );
  for (const raw of result.rows) {
    const row = requireRecord(raw);
    const documentId = parseString(row.document_id);
    const block: ExtractionBlock = {
      page: parseNumber(row.page),
      x: parseNumber(row.x),
      y: parseNumber(row.y),
      width: parseNumber(row.width),
      height: parseNumber(row.height),
      text: parseString(row.text),
    };
    const blockIndex = parseOptionalNumber(row.block_index);
    if (blockIndex != null) {
      block.blockIndex = blockIndex;
    }
    const list = out.get(documentId) ?? [];
    list.push(block);
    out.set(documentId, list);
  }
  return out;
}

export interface DocumentExtractionRows {
  fields: ExtractedField[];
  blocks: ExtractionBlock[];
}

/** Field values and layout blocks for many documents (two queries in total). */
export async function loadExtractionForDocuments(
  client: Db,
  documentIds: string[]
): Promise<Map<string, DocumentExtractionRows>> {
  const [fields, blocks] = await Promise.all([
    loadDocumentFieldValues(client, documentIds),
    loadBlocks(client, documentIds),
  ]);
  const out = new Map<string, DocumentExtractionRows>();
  for (const id of documentIds) {
    out.set(id, { fields: fields.get(id) ?? [], blocks: blocks.get(id) ?? [] });
  }
  return out;
}

export async function loadExtractionForDocument(
  client: Db,
  documentId: string
): Promise<DocumentExtractionRows> {
  const map = await loadExtractionForDocuments(client, [documentId]);
  return map.get(documentId) ?? { fields: [], blocks: [] };
}
