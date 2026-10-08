import { dedupeExtractedFields, type ExtractionBlock, type ExtractedField } from '@docuvate/contracts';
import type { DocumentEntity, DocumentStatus } from '../domain/document.entity.js';
import type { TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';

function normalizeBlock(raw: unknown): ExtractionBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const page = Number(row['page']);
  const x = Number(row['x']);
  const y = Number(row['y']);
  const width = Number(row['width']);
  const height = Number(row['height']);
  const text = String(row['text'] ?? '').trim();
  if (!Number.isFinite(page) || page < 1 || !text) return null;
  if (![x, y, width, height].every(Number.isFinite)) return null;
  const blockIndexRaw = row['blockIndex'];
  const blockIndex =
    blockIndexRaw === undefined || blockIndexRaw === null ? undefined : Number(blockIndexRaw);
  return {
    page,
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
    width: Math.min(1, Math.max(0, width)),
    height: Math.min(1, Math.max(0, height)),
    text,
    blockIndex: Number.isFinite(blockIndex) ? blockIndex : undefined,
  };
}

/** Applies read-side normalization (dedupe, block clamping) to stored extraction rows. */
export function normalizeExtraction(
  raw: { fields: ExtractedField[]; blocks: ExtractionBlock[] } | undefined
): { fields: ExtractedField[]; blocks: ExtractionBlock[] } {
  if (!raw) return { fields: [], blocks: [] };
  return {
    fields: dedupeExtractedFields(raw.fields),
    blocks: raw.blocks.map(normalizeBlock).filter((b): b is ExtractionBlock => b != null),
  };
}

export interface DocumentRowJoins {
  tags?: TagEntity[];
  correspondent?: { id: string; name: string } | null;
  extraction?: { fields: ExtractedField[]; blocks: ExtractionBlock[] };
}

/** Maps tag objects from Postgres `json_agg` / JSON columns (snake_case keys). */
export function mapTagFromJson(raw: Record<string, unknown>): TagEntity {
  return {
    id: String(raw['id']),
    userId: String(raw['user_id'] ?? raw['userId']),
    name: String(raw['name']),
    color: (raw['color'] as string | null) ?? null,
    isInbox: Boolean(raw['is_inbox'] ?? raw['isInbox']),
    matchingAlgorithm: (raw['matching_algorithm'] as TagEntity['matchingAlgorithm']) ?? 'none',
    match: String(raw['match_text'] ?? raw['match'] ?? ''),
  };
}

export function parseTagsJson(tagsRaw: unknown): TagEntity[] {
  if (typeof tagsRaw === 'string') {
    const parsed = JSON.parse(tagsRaw) as Record<string, unknown>[];
    return parsed.map((t) => mapTagFromJson(t));
  }
  if (Array.isArray(tagsRaw)) {
    return tagsRaw.map((raw) => mapTagFromJson(raw as Record<string, unknown>));
  }
  return [];
}

export function mapDocumentRow(
  row: Record<string, unknown>,
  joins: DocumentRowJoins = {}
): DocumentEntity {
  const { fields, blocks } = normalizeExtraction(joins.extraction);
  const text = row['extracted_text'] as string | null;
  const markdownRaw = row['extracted_markdown'] as string | null;
  const markdown = markdownRaw?.trim() ? markdownRaw : undefined;
  const extraction =
    text != null
      ? {
          text,
          fields,
          blocks: blocks.length > 0 ? blocks : undefined,
          markdown,
        }
      : undefined;

  const folderIdRaw = row['folder_id'];
  const folderName = row['folder_name'];
  const folderMappeIdRaw = row['folder_mappe_id'];

  const documentDateRaw = row['document_date'];
  const correspondent = joins.correspondent ?? null;

  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    filename: String(row['filename']),
    title: String(row['title'] ?? row['filename']),
    mimeType: String(row['mime_type']),
    storageKey: String(row['storage_key']),
    contentHash: (row['content_hash'] as string | null) ?? null,
    status: row['status'] as DocumentStatus,
    documentDate:
      documentDateRaw != null && documentDateRaw !== ''
        ? new Date(String(documentDateRaw))
        : null,
    notes: (row['notes'] as string | null) ?? null,
    ingestSource: (row['ingest_source'] as string | null) ?? null,
    folderId: folderIdRaw != null ? String(folderIdRaw) : null,
    mappeId: row['mappe_id'] != null ? String(row['mappe_id']) : null,
    folder:
      folderIdRaw != null && folderName != null
        ? {
            id: String(folderIdRaw),
            name: String(folderName),
            mappeId: folderMappeIdRaw != null ? String(folderMappeIdRaw) : null,
          }
        : null,
    correspondent: correspondent
      ? {
          id: correspondent.id,
          userId: String(row['user_id']),
          name: correspondent.name,
          matchingAlgorithm: 'none',
          match: '',
        }
      : null,
    tags: joins.tags ?? [],
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'])),
    extraction,
  };
}
