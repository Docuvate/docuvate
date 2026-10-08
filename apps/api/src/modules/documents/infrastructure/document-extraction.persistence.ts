import type pg from 'pg';
import type { ExtractionBlock, ExtractedField } from '@docuvate/contracts';
import {
  loadDocumentFieldValues,
  replaceDocumentFieldValues,
} from '../../search/infrastructure/document-field-value-index.js';

type Db = pg.Pool | pg.PoolClient;

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
        block.text ?? '',
      ]
    );
  }
}

async function loadBlocks(client: Db, documentIds: string[]): Promise<Map<string, ExtractionBlock[]>> {
  const out = new Map<string, ExtractionBlock[]>();
  if (documentIds.length === 0) return out;
  const result = await client.query(
    `SELECT document_id, page, block_index, x, y, width, height, text
     FROM document_extraction_blocks
     WHERE document_id = ANY($1::uuid[])
     ORDER BY document_id, position`,
    [documentIds]
  );
  for (const row of result.rows) {
    const documentId = String(row['document_id']);
    const block: ExtractionBlock = {
      page: Number(row['page']),
      x: Number(row['x']),
      y: Number(row['y']),
      width: Number(row['width']),
      height: Number(row['height']),
      text: String(row['text'] ?? ''),
    };
    if (row['block_index'] != null) {
      block.blockIndex = Number(row['block_index']);
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
