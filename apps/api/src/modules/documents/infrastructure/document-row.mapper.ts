// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  dedupeExtractedFields,
  type DocumentExtractionImageDto,
  type ExtractedField,
  type ExtractionBlock,
  type LayoutIrPageSummary,
  type MatchingAlgorithm,
} from '@docuvate/contracts';

import {
  parseBoolean,
  parseDate,
  parseEnum,
  parseJsonString,
  parseNumber,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  recordFromUnknown,
} from '../../../shared/infrastructure/database/row-parse.js';
import type { TagEntity } from '../../taxonomy/domain/taxonomy.entity.js';
import type { DocumentEntity, DocumentStatus } from '../domain/document.entity.js';

const MATCHING_ALGORITHMS: readonly MatchingAlgorithm[] = ['none', 'any', 'all', 'exact', 'regex'];
const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'uploaded',
  'queued',
  'extracting',
  'ready',
  'failed',
];

function normalizeBlock(raw: unknown): ExtractionBlock | null {
  const row = recordFromUnknown(raw);
  if (!row) return null;
  const page = parseNumber(row.page);
  const x = parseNumber(row.x);
  const y = parseNumber(row.y);
  const width = parseNumber(row.width);
  const height = parseNumber(row.height);
  const text = parseString(row.text).trim();
  if (!Number.isFinite(page) || page < 1 || !text) return null;
  if (![x, y, width, height].every(Number.isFinite)) return null;
  const blockIndex = parseOptionalNumber(row.blockIndex);
  return {
    page,
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
    width: Math.min(1, Math.max(0, width)),
    height: Math.min(1, Math.max(0, height)),
    text,
    blockIndex: blockIndex ?? undefined,
  };
}

/** Applies read-side normalization (dedupe, block clamping) to stored extraction rows. */
export function normalizeExtraction(
  raw:
    | { fields: ExtractedField[]; blocks: ExtractionBlock[]; images?: DocumentExtractionImageDto[] }
    | undefined
): { fields: ExtractedField[]; blocks: ExtractionBlock[]; images: DocumentExtractionImageDto[] } {
  if (!raw) return { fields: [], blocks: [], images: [] };
  return {
    fields: dedupeExtractedFields(raw.fields),
    blocks: raw.blocks.map(normalizeBlock).filter((b): b is ExtractionBlock => b != null),
    images: raw.images ?? [],
  };
}

export interface DocumentRowJoins {
  tags?: TagEntity[];
  extraction?: {
    fields: ExtractedField[];
    blocks: ExtractionBlock[];
    images?: DocumentExtractionImageDto[];
  };
}

/** Maps tag objects from Postgres `json_agg` / JSON columns (snake_case keys). */
export function mapTagFromJson(raw: Record<string, unknown>): TagEntity {
  const userIdRaw = raw.user_id ?? raw.userId;
  const matchRaw = raw.match_text ?? raw.match;
  const isInboxRaw = raw.is_inbox ?? raw.isInbox;
  return {
    id: parseString(raw.id),
    userId: parseString(userIdRaw),
    name: parseString(raw.name),
    color: parseOptionalString(raw.color),
    isInbox: parseBoolean(isInboxRaw),
    matchingAlgorithm: parseEnum(raw.matching_algorithm, MATCHING_ALGORITHMS, 'none'),
    match: parseString(matchRaw),
  };
}

export function parseLayoutIrPagesJson(raw: unknown): LayoutIrPageSummary[] {
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = parseJsonString(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const pages: LayoutIrPageSummary[] = [];
  for (const item of parsed) {
    const row = recordFromUnknown(item);
    if (!row) continue;
    const page = parseNumber(row.page);
    const widthPt = parseNumber(row.widthPt);
    const heightPt = parseNumber(row.heightPt);
    if (!Number.isFinite(page) || page < 1) continue;
    if (!Number.isFinite(widthPt) || !Number.isFinite(heightPt)) continue;
    pages.push({ page, widthPt, heightPt });
  }
  return pages;
}

export function parseTagsJson(tagsRaw: unknown): TagEntity[] {
  if (typeof tagsRaw === 'string') {
    try {
      const parsed = parseJsonString(tagsRaw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => recordFromUnknown(item))
        .filter((item): item is Record<string, unknown> => item != null)
        .map((t) => mapTagFromJson(t));
    } catch {
      return [];
    }
  }
  if (Array.isArray(tagsRaw)) {
    return tagsRaw
      .map((item) => recordFromUnknown(item))
      .filter((item): item is Record<string, unknown> => item != null)
      .map((raw) => mapTagFromJson(raw));
  }
  return [];
}

export function mapDocumentRow(
  row: Record<string, unknown>,
  joins: DocumentRowJoins = {}
): DocumentEntity {
  const { fields, blocks, images } = normalizeExtraction(joins.extraction);
  const text = parseOptionalString(row.extracted_text);
  const layoutIrAvailable = parseBoolean(row.layout_ir_available);
  const layoutIrPages = parseLayoutIrPagesJson(row.layout_ir_pages_json);
  const extraction =
    text != null
      ? {
          text,
          fields,
          blocks: blocks.length > 0 ? blocks : undefined,
          images: images.length > 0 ? images : undefined,
          layoutIrAvailable,
          ...(layoutIrPages.length > 0 ? { layoutIrPages } : {}),
        }
      : undefined;

  const folderId = parseOptionalString(row.folder_id);
  const folderName = parseOptionalString(row.folder_name);
  const documentDate = parseOptionalDate(row.document_date);

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
      folderId != null && folderName != null
        ? {
            id: folderId,
            name: folderName,
          }
        : null,
    tags: joins.tags ?? [],
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
    extraction,
  };
}
