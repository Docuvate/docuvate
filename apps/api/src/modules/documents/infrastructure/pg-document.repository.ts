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
  parseString,
  recordFromUnknown,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { DocumentEntity, DocumentStatus } from '../domain/document.entity.js';
import {
  type DocumentExtractionRows,
  loadExtractionForDocument,
  loadExtractionForDocuments,
  mergeExtractionFieldRows,
  replaceDocumentExtractionBlocks,
  replaceDocumentExtractionFields,
} from './document-extraction.persistence.js';
import { mapDocumentRow, parseLayoutIrPagesJson, parseTagsJson } from './document-row.mapper.js';
import { textFromExtractionBlocks } from './extraction-text.util.js';

const LIST_SELECT = `
  SELECT d.*,
    EXISTS (SELECT 1 FROM document_layout_ir li WHERE li.document_id = d.id) AS layout_ir_available,
    f.name AS folder_name,
    f.mappe_id AS folder_mappe_id,
    c.id AS corr_id, c.name AS corr_name,
    COALESCE(
      json_agg(
        json_build_object(
          'id', t.id,
          'user_id', t.user_id,
          'name', t.name,
          'color', t.color,
          'is_inbox', t.is_inbox
        )
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'
    ) AS tags_json
  FROM documents d
  LEFT JOIN folders f ON f.id = d.folder_id
  LEFT JOIN correspondents c ON c.id = d.correspondent_id
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
        id, user_id, filename, title, mime_type, storage_key, status,
        document_date, notes, folder_id, mappe_id, correspondent_id, ingest_source, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        doc.id,
        doc.userId,
        doc.filename,
        doc.title,
        doc.mimeType,
        doc.storageKey,
        doc.status,
        doc.documentDate ?? null,
        doc.notes ?? null,
        doc.folderId ?? null,
        doc.mappeId ?? null,
        doc.correspondent?.id ?? null,
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
      `${LIST_SELECT} WHERE d.id = $1 GROUP BY d.id, f.id, c.id`,
      [id]
    );
    if (!result.rows[0]) return null;
    const entity = await this.mapListRow(requireRecord(result.rows[0]));
    const pages = await this.loadLayoutIrPageSummaries(id);
    return this.attachLayoutIrPages(entity, pages);
  }

  async findByIdForUser(id: string, userId: string): Promise<DocumentEntity | null> {
    const result = await this.pool.query(
      `${LIST_SELECT} WHERE d.id = $1 AND d.user_id = $2 GROUP BY d.id, f.id, c.id`,
      [id, userId]
    );
    if (!result.rows[0]) return null;
    const entity = await this.mapListRow(requireRecord(result.rows[0]));
    const pages = await this.loadLayoutIrPageSummaries(id);
    return this.attachLayoutIrPages(entity, pages);
  }

  async listForUser(userId: string, filters: DocumentListQuery = {}): Promise<DocumentEntity[]> {
    const conditions: string[] = [
      'd.user_id = $1',
      `NOT EXISTS (
        SELECT 1 FROM document_stack_members m
        WHERE m.document_id = d.id AND m.role = 'version'
      )`,
    ];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`d.status = $${String(paramIndex)}`);
      paramIndex += 1;
      params.push(filters.status);
    }
    if (filters.correspondentId) {
      conditions.push(`d.correspondent_id = $${String(paramIndex)}`);
      paramIndex += 1;
      params.push(filters.correspondentId);
    }
    const tagIds = filters.tagIds?.filter(Boolean) ?? (filters.tagId ? [filters.tagId] : undefined);
    if (tagIds?.length) {
      for (const tagId of tagIds) {
        conditions.push(
          `EXISTS (SELECT 1 FROM document_tags dtf WHERE dtf.document_id = d.id AND dtf.tag_id = $${String(paramIndex)})`
        );
        paramIndex += 1;
        params.push(tagId);
      }
    }
    if (filters.inbox) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM document_tags dit
          JOIN tags it ON it.id = dit.tag_id
          WHERE dit.document_id = d.id AND it.is_inbox = true
        )`
      );
    }
    if (filters.withoutNonInboxLabel) {
      conditions.push(
        `NOT EXISTS (
          SELECT 1 FROM document_tags dtn
          JOIN tags nt ON nt.id = dtn.tag_id
          WHERE dtn.document_id = d.id AND nt.is_inbox = false
        )`
      );
    }
    if (filters.folderId) {
      conditions.push(`d.folder_id = $${String(paramIndex)}`);
      paramIndex += 1;
      params.push(filters.folderId);
    }
    if (filters.mappeId) {
      const mappeParam = String(paramIndex);
      conditions.push(
        `(d.mappe_id = $${mappeParam} OR EXISTS (
          SELECT 1 FROM folders mf
          WHERE mf.id = d.folder_id AND mf.mappe_id = $${mappeParam} AND mf.user_id = d.user_id
        ))`
      );
      params.push(filters.mappeId);
      paramIndex += 1;
    }
    if (filters.unfiled) {
      conditions.push(`d.folder_id IS NULL`);
    }
    if (filters.q?.trim()) {
      const q = filters.q.trim();
      const qParam = String(paramIndex);
      conditions.push(
        `(d.filename ILIKE '%' || $${qParam} || '%'
          OR d.title ILIKE '%' || $${qParam} || '%'
          OR d.search_vector @@ plainto_tsquery('simple', $${qParam}))`
      );
      params.push(q);
      paramIndex += 1;
    }
    if (filters.documentDateFrom) {
      conditions.push(`d.document_date >= $${String(paramIndex)}::date`);
      paramIndex += 1;
      params.push(filters.documentDateFrom);
    }
    if (filters.documentDateTo) {
      conditions.push(`d.document_date <= $${String(paramIndex)}::date`);
      paramIndex += 1;
      params.push(filters.documentDateTo);
    }

    const sortField = filters.sort ?? 'updatedAt';
    const order = filters.order === 'asc' ? 'ASC' : 'DESC';
    const sortColumn: Record<string, string> = {
      updatedAt: 'd.updated_at',
      createdAt: 'd.created_at',
      title: 'd.title',
      documentDate: 'd.document_date',
    };
    const orderBy = sortColumn[sortField] ?? 'd.updated_at';

    const sql = `${LIST_SELECT}
      WHERE ${conditions.join(' AND ')}
      GROUP BY d.id, f.id, c.id
      ORDER BY ${orderBy} ${order} NULLS LAST`;

    const result = await this.pool.query(sql, params);
    const extractions = await loadExtractionForDocuments(
      this.pool,
      result.rows.map((raw) => parseString(requireRecord(raw).id))
    );
    return result.rows.map((raw) => {
      const row = requireRecord(raw);
      const id = parseString(row.id);
      return this.mapRow(row, extractions.get(id) ?? { fields: [], blocks: [] });
    });
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    await this.pool.query(`UPDATE documents SET status = $2, updated_at = now() WHERE id = $1`, [
      id,
      status,
    ]);
  }

  async saveExtraction(id: string, result: ExtractionResult): Promise<void> {
    const doc = await this.pool.query(`SELECT user_id FROM documents WHERE id = $1`, [id]);
    const docRow = recordFromUnknown(doc.rows[0]);
    const userId = docRow ? parseString(docRow.user_id) : null;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE documents SET extracted_text = $2, extracted_markdown = $3, updated_at = now() WHERE id = $1`,
        [id, result.text, result.markdown ?? null]
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
    if (patch.mappeId !== undefined) {
      fields.push(`mappe_id = $${String(idx)}`);
      idx += 1;
      params.push(patch.mappeId);
    }
    if (patch.correspondentId !== undefined) {
      fields.push(`correspondent_id = $${String(idx)}`);
      idx += 1;
      params.push(patch.correspondentId);
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

  async setCorrespondentForDocuments(
    userId: string,
    documentIds: string[],
    correspondentId: string | null
  ): Promise<number> {
    if (documentIds.length === 0) return 0;
    const result = await this.pool.query(
      `UPDATE documents SET correspondent_id = $3, updated_at = now()
       WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, documentIds, correspondentId]
    );
    return result.rowCount ?? 0;
  }

  async setFolderForDocuments(
    userId: string,
    documentIds: string[],
    folderId: string | null
  ): Promise<number> {
    if (documentIds.length === 0) return 0;
    const result = await this.pool.query(
      `UPDATE documents SET folder_id = $3, mappe_id = NULL, updated_at = now()
       WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, documentIds, folderId]
    );
    return result.rowCount ?? 0;
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
    const corrId = row.corr_id;
    const corrIdStr =
      corrId === null || corrId === undefined ? null : parseString(corrId);
    return mapDocumentRow(row, {
      tags,
      correspondent: corrIdStr
        ? { id: corrIdStr, name: parseString(row.corr_name) }
        : null,
      extraction,
    });
  }
}
