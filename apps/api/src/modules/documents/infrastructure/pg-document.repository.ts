// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  dedupeExtractedFields,
  type DocumentListQuery,
  type ExtractionResult,
} from '@docuvate/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError } from '../../../shared/domain/errors.js';
import type { DocumentRepository, DocumentUpdatePatch } from '../../../shared/domain/ports.js';
import {
  isRecord,
  parseJsonString,
  parseNumber,
  parseOptionalString,
  parseString,
  recordFromUnknown,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { hashNormalizedExtractedText } from '../../duplicates/domain/normalized-extracted-text-hash.js';
import { globalFieldStorageKey } from '../../recognized-fields/domain/recognized-field.entity.js';
import { upsertDocumentFieldValue } from '../../search/infrastructure/document-field-value-index.js';
import type { DocumentEntity, DocumentStatus } from '../domain/document.entity.js';
import {
  type DocumentExtractionRows,
  loadExtractionForDocument,
  loadExtractionForDocuments,
  mergeExtractionFieldRows,
  replaceDocumentExtractionBlocks,
  replaceDocumentExtractionFields,
} from './document-extraction.persistence.js';
import { insertDocumentExtractionImageRow } from './document-extraction-images.persistence.js';
import {
  assertCursorMatchesQuery,
  decodeDocumentListCursor,
  encodeDocumentListCursor,
} from './document-list-cursor.js';
import { buildDocumentListFilterSql } from './document-list-filter.sql.js';
import {
  buildDocumentListKeysetSql,
  buildDocumentListOrderBy,
  cursorPayloadFromDocumentRow,
  resolvedDocumentListSort,
} from './document-list-keyset.js';
import {
  isPaginatedDocumentListQuery,
  paginatedFetchLimit,
} from './document-list-pagination.js';
import { mapDocumentRow, parseLayoutIrPagesJson, parseTagsJson } from './document-row.mapper.js';
import { textFromExtractionBlocks } from './extraction-text.util.js';

const LIST_SELECT = `
  SELECT d.*,
    EXISTS (SELECT 1 FROM document_layout_ir li WHERE li.document_id = d.id) AS layout_ir_available,
    f.name AS folder_name,
    COALESCE(
      json_agg(
        json_build_object(
          'id', t.id,
          'user_id', t.user_id,
          'name', t.name,
          'color', t.color,
          'is_inbox', t.is_inbox,
          'matching_algorithm', t.matching_algorithm,
          'match_text', t.match_text
        )
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'
    ) AS tags_json
  FROM documents d
  LEFT JOIN folders f ON f.id = d.folder_id
  LEFT JOIN document_tags dtag ON dtag.document_id = d.id
  LEFT JOIN tags t ON t.id = dtag.tag_id
`;

@Injectable()
export class PgDocumentRepository implements DocumentRepository {
  private readonly logger = new Logger(PgDocumentRepository.name);

  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  private async loadLayoutIrPageSummaries(
    documentId: string
  ): Promise<{ page: number; widthPt: number; heightPt: number }[]> {
    const result = await this.pool.query(
      `SELECT page, width_pt, height_pt
       FROM document_layout_ir_pages
       WHERE document_id = $1
       ORDER BY page`,
      [documentId]
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      return {
        page: Number(row.page),
        widthPt: Number(row.width_pt),
        heightPt: Number(row.height_pt),
      };
    });
  }

  private attachLayoutIrPages(
    entity: DocumentEntity,
    pages: { page: number; widthPt: number; heightPt: number }[]
  ): DocumentEntity {
    if (!entity.extraction || pages.length === 0) return entity;
    return {
      ...entity,
      extraction: { ...entity.extraction, layoutIrPages: pages },
    };
  }

  async create(doc: DocumentEntity): Promise<DocumentEntity> {
    await this.pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, file_size_bytes, storage_key, status,
        document_date, notes, folder_id, ingest_source, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        doc.id,
        doc.userId,
        doc.filename,
        doc.title,
        doc.mimeType,
        doc.fileSizeBytes,
        doc.storageKey,
        doc.status,
        doc.documentDate ?? null,
        doc.notes ?? null,
        doc.folderId ?? null,
        doc.ingestSource ?? null,
        doc.createdAt,
        doc.updatedAt,
      ]
    );
    if (doc.tags.length > 0) {
      await this.setTagsForDocument(
        doc.id,
        doc.tags.map((t) => t.id)
      );
    }
    const loaded = await this.findById(doc.id);
    return loaded ?? doc;
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const result = await this.pool.query(
      `${LIST_SELECT} WHERE d.id = $1 GROUP BY d.id, f.id`,
      [id]
    );
    if (!result.rows[0]) return null;
    const entity = await this.mapListRow(requireRecord(result.rows[0]));
    const pages = await this.loadLayoutIrPageSummaries(id);
    return this.attachLayoutIrPages(entity, pages);
  }

  async filterOwnedDocumentIds(userId: string, documentIds: string[]): Promise<string[]> {
    if (documentIds.length === 0) {
      return [];
    }
    const result = await this.pool.query(
      `SELECT id::text AS id FROM documents WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, documentIds]
    );
    return result.rows.map((row) => parseString(requireRecord(row).id));
  }

  async findByIdForUser(id: string, userId: string): Promise<DocumentEntity | null> {
    const result = await this.pool.query(
      `${LIST_SELECT} WHERE d.id = $1 AND d.user_id = $2 GROUP BY d.id, f.id`,
      [id, userId]
    );
    if (!result.rows[0]) return null;
    const entity = await this.mapListRow(requireRecord(result.rows[0]));
    const pages = await this.loadLayoutIrPageSummaries(id);
    return this.attachLayoutIrPages(entity, pages);
  }

  async countForUser(userId: string, filters: DocumentListQuery = {}): Promise<number> {
    const { whereSql, params } = buildDocumentListFilterSql(userId, filters);
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count FROM documents d WHERE ${whereSql}`,
      params
    );
    const row = requireRecord(result.rows[0]);
    return parseNumber(row.count, 0);
  }

  async listForUser(userId: string, filters: DocumentListQuery = {}): Promise<DocumentEntity[]> {
    const page = await this.listForUserInternal(userId, filters);
    return page.entities;
  }

  async listPageForUser(
    userId: string,
    filters: DocumentListQuery
  ): Promise<{ entities: DocumentEntity[]; hasMore: boolean; nextCursor: string | null }> {
    return this.listForUserInternal(userId, filters);
  }

  private async listForUserInternal(
    userId: string,
    filters: DocumentListQuery = {}
  ): Promise<{ entities: DocumentEntity[]; hasMore: boolean; nextCursor: string | null }> {
    const { whereSql, params } = buildDocumentListFilterSql(userId, filters);
    const { sortField, order } = resolvedDocumentListSort(filters);
    const orderBy = buildDocumentListOrderBy(sortField, order);

    const paginated = isPaginatedDocumentListQuery(filters);
    const queryParams = [...params];
    let whereWithKeyset = whereSql;

    if (paginated && filters.cursor) {
      const cursor = decodeDocumentListCursor(filters.cursor);
      assertCursorMatchesQuery(cursor, sortField, order);
      const keyset = buildDocumentListKeysetSql(
        sortField,
        order,
        cursor,
        queryParams.length + 1
      );
      whereWithKeyset = `${whereSql} AND ${keyset.conditionSql}`;
      queryParams.push(...keyset.params);
    }

    const limitClause = paginated ? ` LIMIT $${String(queryParams.length + 1)}` : '';
    if (paginated) {
      queryParams.push(paginatedFetchLimit(filters));
    }

    const sql = `${LIST_SELECT}
      WHERE ${whereWithKeyset}
      GROUP BY d.id, f.id
      ORDER BY ${orderBy}${limitClause}`;

    const result = await this.pool.query(sql, queryParams);
    let rows = result.rows;
    let hasMore = false;
    if (paginated) {
      const pageSize = paginatedFetchLimit(filters) - 1;
      hasMore = rows.length > pageSize;
      if (hasMore) {
        rows = rows.slice(0, pageSize);
      }
    }

    const extractions = await loadExtractionForDocuments(
      this.pool,
      rows.map((raw) => parseString(requireRecord(raw).id))
    );
    const entities = rows.map((raw) => {
      const row = requireRecord(raw);
      const id = parseString(row.id);
      return this.mapRow(row, extractions.get(id) ?? { fields: [], blocks: [], images: [] });
    });

    let nextCursor: string | null = null;
    if (paginated && hasMore && rows.length > 0) {
      const lastRow = requireRecord(rows[rows.length - 1]);
      const cursorRow = {
        id: parseString(lastRow.id),
        updated_at: lastRow.updated_at instanceof Date
          ? lastRow.updated_at
          : new Date(parseString(lastRow.updated_at)),
        created_at: lastRow.created_at instanceof Date
          ? lastRow.created_at
          : new Date(parseString(lastRow.created_at)),
        title: parseString(lastRow.title),
        document_date:
          lastRow.document_date == null
            ? null
            : lastRow.document_date instanceof Date
              ? lastRow.document_date
              : new Date(parseString(lastRow.document_date)),
      };
      nextCursor = encodeDocumentListCursor(
        cursorPayloadFromDocumentRow(sortField, order, cursorRow)
      );
    }

    return { entities, hasMore, nextCursor };
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    options?: { failureReason?: string | null }
  ): Promise<void> {
    if (status === 'failed') {
      const reason = options?.failureReason?.trim().slice(0, 2000) ?? null;
      await this.pool.query(
        `UPDATE documents SET status = $2, extraction_failure_reason = $3, updated_at = now() WHERE id = $1`,
        [id, status, reason]
      );
      return;
    }
    await this.pool.query(
      `UPDATE documents SET status = $2, extraction_failure_reason = NULL, updated_at = now() WHERE id = $1`,
      [id, status]
    );
  }

  async tryClaimForExtraction(
    id: string,
    staleAfterSeconds: number
  ): Promise<'claimed' | 'already_ready' | 'busy'> {
    const claimed = await this.pool.query<{ id: string }>(
      `UPDATE documents
       SET status = 'extracting', extraction_failure_reason = NULL, updated_at = now()
       WHERE id = $1
         AND (
           status IN ('queued', 'uploaded', 'failed')
           OR (
             status = 'extracting'
             AND updated_at < now() - ($2::int * interval '1 second')
           )
         )
       RETURNING id`,
      [id, staleAfterSeconds]
    );
    if (claimed.rowCount && claimed.rowCount > 0) {
      return 'claimed';
    }
    const statusRow = await this.pool.query<{ status: string }>(
      `SELECT status FROM documents WHERE id = $1`,
      [id]
    );
    const row = recordFromUnknown(statusRow.rows[0]);
    const status = row ? parseString(row.status) : '';
    if (status === 'ready') {
      return 'already_ready';
    }
    return 'busy';
  }

  async setHeuristicFieldExtractorVersion(documentId: string, version: number): Promise<void> {
    await this.pool.query(
      `UPDATE documents SET heuristic_field_extractor_version = $2, updated_at = now() WHERE id = $1`,
      [documentId, version]
    );
  }

  async listDocumentIdsNeedingHeuristicFieldRefresh(
    userId: string,
    currentVersion: number,
    limit: number
  ): Promise<string[]> {
    const capped = Math.min(Math.max(limit, 1), 5000);
    const result = await this.pool.query<{ id: string }>(
      `SELECT d.id
       FROM documents d
       WHERE d.user_id = $1
         AND trim(coalesce(d.extracted_text, '')) <> ''
         AND d.status IN ('ready', 'failed')
         AND coalesce(d.heuristic_field_extractor_version, 0) < $2
       ORDER BY d.updated_at DESC
       LIMIT $3`,
      [userId, currentVersion, capped]
    );
    return result.rows.map((row) => parseString(requireRecord(row).id));
  }

  async saveExtractionImages(
    documentId: string,
    images: {
      id: string;
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      kind: 'embedded' | 'figure';
      caption: string | null;
      thumbnailStorageKey: string;
    }[]
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM document_extraction_images WHERE document_id = $1`, [
        documentId,
      ]);
      for (const [position, row] of images.entries()) {
        await insertDocumentExtractionImageRow(
          client,
          documentId,
          position,
          {
            page: row.page,
            x: row.x,
            y: row.y,
            width: row.width,
            height: row.height,
            kind: row.kind,
            caption: row.caption,
          },
          row.id,
          row.thumbnailStorageKey
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveExtraction(id: string, result: ExtractionResult): Promise<void> {
    const doc = await this.pool.query(`SELECT user_id FROM documents WHERE id = $1`, [id]);
    const docRow = recordFromUnknown(doc.rows[0]);
    const userId = docRow ? parseString(docRow.user_id) : null;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const extractedTextHash = hashNormalizedExtractedText(result.text);
      await client.query(
        `UPDATE documents
         SET extracted_text = $2,
             extracted_markdown = $3,
             extracted_text_hash = $4,
             updated_at = now()
         WHERE id = $1`,
        [id, result.text, result.markdown ?? null, extractedTextHash]
      );
      await client.query(`DELETE FROM document_layout_ir WHERE document_id = $1`, [id]);
      if (result.layoutIr != null && isRecord(result.layoutIr)) {
        const versionRaw = result.layoutIr.version;
        const version = typeof versionRaw === 'number' ? versionRaw : Number(versionRaw);
        if (version !== 1) {
          this.logger.warn(`Skipping layout IR for document ${id}: version must be 1`);
        } else {
          await client.query(
            `INSERT INTO document_layout_ir (document_id, version, ir) VALUES ($1, $2, $3::jsonb)`,
            [id, version, JSON.stringify(result.layoutIr)]
          );
          const pages = parseLayoutIrPagesJson(result.layoutIr.pages);
          if (pages.length > 0) {
            const byPage = new Map<number, { page: number; widthPt: number; heightPt: number }>();
            for (const page of pages) {
              if (!byPage.has(page.page)) {
                byPage.set(page.page, page);
              }
            }
            for (const page of [...byPage.values()].sort((a, b) => a.page - b.page)) {
              await client.query(
                `INSERT INTO document_layout_ir_pages (document_id, page, width_pt, height_pt)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (document_id, page) DO UPDATE SET
                   width_pt = EXCLUDED.width_pt,
                   height_pt = EXCLUDED.height_pt`,
                [id, page.page, page.widthPt, page.heightPt]
              );
            }
          }
        }
      }
      if (userId) {
        await replaceDocumentExtractionFields(
          client,
          id,
          userId,
          mergeExtractionFieldRows(result.fields, result.fieldSuggestions ?? [])
        );
        await replaceDocumentExtractionBlocks(client, id, result.blocks ?? []);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findLayoutIrForUser(id: string, userId: string): Promise<Record<string, unknown> | null> {
    const result = await this.pool.query(
      `SELECT li.ir
       FROM document_layout_ir li
       INNER JOIN documents d ON d.id = li.document_id
       WHERE li.document_id = $1 AND d.user_id = $2`,
      [id, userId]
    );
    const row = recordFromUnknown(result.rows[0]);
    const raw = row?.ir;
    if (raw == null) return null;
    const fromObject = recordFromUnknown(raw);
    if (fromObject) return fromObject;
    if (typeof raw === 'string' && raw.trim()) {
      return recordFromUnknown(parseJsonString(raw));
    }
    return null;
  }

  async setContentHash(id: string, hash: string): Promise<void> {
    await this.pool.query(
      `UPDATE documents SET content_hash = $2, updated_at = now() WHERE id = $1`,
      [id, hash]
    );
  }

  async setExtractedTextHash(id: string, hash: string): Promise<void> {
    await this.pool.query(
      `UPDATE documents SET extracted_text_hash = $2, updated_at = now() WHERE id = $1`,
      [id, hash]
    );
  }

  async setPreviewStorageKey(id: string, previewStorageKey: string | null): Promise<void> {
    await this.pool.query(
      `UPDATE documents SET preview_storage_key = $2, updated_at = now() WHERE id = $1`,
      [id, previewStorageKey]
    );
  }

  async updateForUser(
    id: string,
    userId: string,
    patch: DocumentUpdatePatch
  ): Promise<DocumentEntity> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError('Document');

    const fields: string[] = [];
    const params: unknown[] = [id, userId];
    let idx = 3;

    if (patch.title !== undefined) {
      fields.push(`title = $${String(idx)}`);
      idx += 1;
      params.push(patch.title);
    }
    if (patch.documentDate !== undefined) {
      fields.push(`document_date = $${String(idx)}`);
      idx += 1;
      params.push(patch.documentDate);
    }
    if (patch.notes !== undefined) {
      fields.push(`notes = $${String(idx)}`);
      idx += 1;
      params.push(patch.notes);
    }
    if (patch.folderId !== undefined) {
      fields.push(`folder_id = $${String(idx)}`);
      idx += 1;
      params.push(patch.folderId);
    }
    const nextFields =
      patch.extractionFields !== undefined
        ? dedupeExtractedFields(patch.extractionFields)
        : undefined;
    const nextBlocks = patch.extractionBlocks;

    if (fields.length > 0) {
      fields.push('updated_at = now()');
      await this.pool.query(
        `UPDATE documents SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2`,
        params
      );
    }

    if (nextFields !== undefined || nextBlocks !== undefined) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        if (nextBlocks !== undefined) {
          const blockText = textFromExtractionBlocks(nextBlocks);
          const nextText = blockText || (existing.extraction?.text ?? '');
          await client.query(
            `UPDATE documents SET extracted_text = $3, updated_at = now() WHERE id = $1 AND user_id = $2`,
            [id, userId, nextText]
          );
        }
        if (nextFields !== undefined) {
          await replaceDocumentExtractionFields(client, id, userId, nextFields);
        }
        if (nextBlocks !== undefined) {
          await replaceDocumentExtractionBlocks(client, id, nextBlocks);
          await client.query(`DELETE FROM document_layout_ir WHERE document_id = $1`, [id]);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (patch.tagIds !== undefined) {
      await this.setTagsForDocument(id, patch.tagIds);
    }

    const updated = await this.findByIdForUser(id, userId);
    if (!updated) throw new NotFoundError('Document');
    return updated;
  }

  async deleteForUser(id: string, userId: string): Promise<DocumentEntity> {
    const doc = await this.findByIdForUser(id, userId);
    if (!doc) throw new NotFoundError('Document');
    await this.pool.query(`DELETE FROM documents WHERE id = $1 AND user_id = $2`, [id, userId]);
    return doc;
  }

  async setTagsForDocument(documentId: string, tagIds: string[]): Promise<void> {
    await this.pool.query(`DELETE FROM document_tags WHERE document_id = $1`, [documentId]);
    if (tagIds.length === 0) return;
    const values = tagIds.map((tagId, i) => `($1, $${String(i + 2)})`).join(', ');
    await this.pool.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ${values}`, [
      documentId,
      ...tagIds,
    ]);
  }

  async addTagToDocuments(userId: string, documentIds: string[], tagId: string): Promise<number> {
    if (documentIds.length === 0) return 0;
    const result = await this.pool.query(
      `INSERT INTO document_tags (document_id, tag_id)
       SELECT d.id, $3 FROM documents d
       WHERE d.user_id = $1 AND d.id = ANY($2::uuid[])
       ON CONFLICT DO NOTHING`,
      [userId, documentIds, tagId]
    );
    return result.rowCount ?? 0;
  }

  async removeTagFromDocuments(
    userId: string,
    documentIds: string[],
    tagId: string
  ): Promise<number> {
    if (documentIds.length === 0) return 0;
    const result = await this.pool.query(
      `DELETE FROM document_tags dt
       USING documents d
       WHERE dt.document_id = d.id AND d.user_id = $1
         AND d.id = ANY($2::uuid[]) AND dt.tag_id = $3`,
      [userId, documentIds, tagId]
    );
    return result.rowCount ?? 0;
  }

  async setAbsenderFieldForDocuments(
    userId: string,
    documentIds: string[],
    value: string | null
  ): Promise<number> {
    if (documentIds.length === 0) return 0;
    const storageKey = globalFieldStorageKey('absender');
    let updated = 0;
    for (const documentId of documentIds) {
      const owned = await this.pool.query(
        `SELECT id FROM documents WHERE user_id = $1 AND id = $2`,
        [userId, documentId]
      );
      if (owned.rowCount === 0) continue;
      await upsertDocumentFieldValue(this.pool, documentId, userId, {
        key: storageKey,
        value: value ?? '',
      });
      await this.pool.query(`UPDATE documents SET updated_at = now() WHERE id = $1`, [documentId]);
      updated += 1;
    }
    return updated;
  }

  async setFolderForDocuments(
    userId: string,
    documentIds: string[],
    folderId: string | null
  ): Promise<number> {
    if (documentIds.length === 0) return 0;
    const result = await this.pool.query(
      `UPDATE documents SET folder_id = $3, updated_at = now()
       WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, documentIds, folderId]
    );
    return result.rowCount ?? 0;
  }

  async moveDocumentsToFolder(
    userId: string,
    documentIds: string[],
    folderId: string | null
  ): Promise<{
    affected: number;
    previousFolderIds: { documentId: string; folderId: string | null }[];
  }> {
    if (documentIds.length === 0) {
      return { affected: 0, previousFolderIds: [] };
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const prior = await client.query(
        `SELECT id, folder_id FROM documents
         WHERE user_id = $1 AND id = ANY($2::uuid[])
         FOR UPDATE`,
        [userId, documentIds]
      );
      const previousFolderIds = prior.rows.map((raw) => {
        const row = requireRecord(raw);
        return {
          documentId: parseString(row.id),
          folderId: parseOptionalString(row.folder_id),
        };
      });
      const update = await client.query(
        `UPDATE documents SET folder_id = $3, updated_at = now()
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, documentIds, folderId]
      );
      await client.query('COMMIT');
      return { affected: update.rowCount ?? 0, previousFolderIds };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteDocuments(userId: string, documentIds: string[]): Promise<DocumentEntity[]> {
    if (documentIds.length === 0) return [];
    const docs: DocumentEntity[] = [];
    for (const id of documentIds) {
      const doc = await this.findByIdForUser(id, userId);
      if (doc) docs.push(doc);
    }
    await this.pool.query(`DELETE FROM documents WHERE user_id = $1 AND id = ANY($2::uuid[])`, [
      userId,
      documentIds,
    ]);
    return docs;
  }

  private async mapListRow(row: Record<string, unknown>): Promise<DocumentEntity> {
    return this.mapRow(row, await loadExtractionForDocument(this.pool, String(row.id)));
  }

  private mapRow(row: Record<string, unknown>, extraction: DocumentExtractionRows): DocumentEntity {
    const tags = parseTagsJson(row.tags_json);
    return mapDocumentRow(row, {
      tags,
      extraction,
    });
  }
}
