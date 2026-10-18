// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentExtractionImageDto, ExtractionBlock, NormalizedBBox } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { loadExtractionImagesForDocuments } from '../../documents/infrastructure/document-extraction-images.persistence.js';
import { resolveCitationBboxFromBlocks } from '../domain/resolve-citation-bbox.js';
import { resolveCitationDocumentImage } from '../domain/resolve-citation-document-image.js';
import { resolveCitationPageFromBlocks } from '../domain/resolve-citation-page.js';
import { normalizeForQuoteMatch } from '../domain/verify-citation-quote.js';

export interface StoredChatCitation {
  ordinal: number;
  documentId: string;
  documentTitle: string;
  chunkId: string;
  quote: string;
  charStart: number;
  charEnd: number;
  page: number | null;
  blocks: ExtractionBlock[];
  bbox: NormalizedBBox | null;
  documentImage: DocumentExtractionImageDto | null;
}

@Injectable()
export class PgChatMessageCitationsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async replaceCitations(
    messageId: string,
    citations: {
      ordinal: number;
      chunkId: string;
      quote: string;
      charStart: number;
      charEnd: number;
    }[]
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [messageId]);
      await client.query(`DELETE FROM chat_message_citations WHERE message_id = $1`, [messageId]);
      const seenOrdinals = new Set<number>();
      let nextOrdinal = 1;
      for (const c of citations) {
        let ordinal = c.ordinal;
        while (seenOrdinals.has(ordinal)) {
          ordinal += 1;
        }
        seenOrdinals.add(ordinal);
        nextOrdinal = Math.max(nextOrdinal, ordinal + 1);
        await client.query(
          `INSERT INTO chat_message_citations (message_id, chunk_id, ordinal, quote, char_start, char_end)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [messageId, c.chunkId, ordinal, c.quote, c.charStart, c.charEnd]
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

  async listForMessages(messageIds: string[]): Promise<Map<string, StoredChatCitation[]>> {
    if (messageIds.length === 0) {
      return new Map();
    }
    const result = await this.pool.query<{
      message_id: string;
      ordinal: number;
      chunk_id: string;
      quote: string;
      char_start: number;
      char_end: number;
      document_id: string;
      title: string;
      page: number | null;
    }>(
      `SELECT c.message_id, c.ordinal, c.chunk_id, c.quote, c.char_start, c.char_end,
              ch.document_id, d.title, ch.page
       FROM chat_message_citations c
       JOIN document_text_chunks ch ON ch.id = c.chunk_id
       JOIN documents d ON d.id = ch.document_id
       WHERE c.message_id = ANY($1::uuid[])
       ORDER BY c.message_id, c.ordinal ASC`,
      [messageIds]
    );
    const byMessage = new Map<string, StoredChatCitation[]>();
    for (const row of result.rows) {
      const list = byMessage.get(row.message_id) ?? [];
      list.push({
        ordinal: row.ordinal,
        chunkId: row.chunk_id,
        quote: row.quote,
        charStart: row.char_start,
        charEnd: row.char_end,
        documentId: row.document_id,
        documentTitle: row.title,
        page: row.page,
        blocks: [],
        bbox: null,
        documentImage: null,
      });
      byMessage.set(row.message_id, list);
    }
    return this.enrichCitationPages(byMessage);
  }

  async listForMessage(messageId: string): Promise<StoredChatCitation[]> {
    const result = await this.pool.query<{
      ordinal: number;
      chunk_id: string;
      quote: string;
      char_start: number;
      char_end: number;
      document_id: string;
      title: string;
      page: number | null;
    }>(
      `SELECT c.ordinal, c.chunk_id, c.quote, c.char_start, c.char_end,
              ch.document_id, d.title, ch.page
       FROM chat_message_citations c
       JOIN document_text_chunks ch ON ch.id = c.chunk_id
       JOIN documents d ON d.id = ch.document_id
       WHERE c.message_id = $1
       ORDER BY c.ordinal ASC`,
      [messageId]
    );
    const mapped = result.rows.map((row) => ({
      ordinal: row.ordinal,
      chunkId: row.chunk_id,
      quote: row.quote,
      charStart: row.char_start,
      charEnd: row.char_end,
      documentId: row.document_id,
      documentTitle: row.title,
      page: row.page,
      blocks: [],
      bbox: null,
      documentImage: null,
    }));
    const enriched = await this.enrichCitationPages(
      new Map([['single', mapped]])
    );
    return enriched.get('single') ?? mapped;
  }

  private async loadBlocksForDocuments(
    documentIds: string[]
  ): Promise<Map<string, ExtractionBlock[]>> {
    if (documentIds.length === 0) {
      return new Map();
    }
    const blocksResult = await this.pool.query<{
      document_id: string;
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      text: string | null;
      block_index: number | null;
    }>(
      `SELECT document_id, page, x, y, width, height, text, block_index
       FROM document_extraction_blocks
       WHERE document_id = ANY($1::uuid[])
       ORDER BY document_id, page, block_index`,
      [documentIds]
    );
    const byDoc = new Map<string, ExtractionBlock[]>();
    for (const row of blocksResult.rows) {
      const list = byDoc.get(row.document_id) ?? [];
      list.push({
        page: row.page,
        x: row.x,
        y: row.y,
        width: row.width,
        height: row.height,
        text: row.text ?? '',
        blockIndex: row.block_index ?? undefined,
      });
      byDoc.set(row.document_id, list);
    }
    return byDoc;
  }

  private async enrichCitationPages(
    byMessage: Map<string, StoredChatCitation[]>
  ): Promise<Map<string, StoredChatCitation[]>> {
    const all = [...byMessage.values()].flat();
    if (all.length === 0) {
      return byMessage;
    }
    const docIds = [...new Set(all.map((c) => c.documentId))];
    const blocksByDoc = await this.loadBlocksForDocuments(docIds);
    const out = new Map<string, StoredChatCitation[]>();
    for (const [messageId, citations] of byMessage) {
      out.set(
        messageId,
        citations.map((c) => ({
          ...c,
          page: resolveCitationPageFromBlocks(
            c.quote,
            blocksByDoc.get(c.documentId) ?? [],
            c.page
          ),
        }))
      );
    }
    return out;
  }

  async loadHighlightBlocksForCitations(
    citations: StoredChatCitation[]
  ): Promise<StoredChatCitation[]> {
    if (citations.length === 0) {
      return citations;
    }
    const docIds = [...new Set(citations.map((c) => c.documentId))];
    const resolved = await this.enrichCitationPages(new Map([['batch', citations]]));
    const enriched = resolved.get('batch') ?? citations;
    const blocksByDoc = await this.loadBlocksForDocuments(docIds);
    const imagesByDoc = await loadExtractionImagesForDocuments(this.pool, docIds);
    return enriched.map((c) => {
      const allBlocks = blocksByDoc.get(c.documentId) ?? [];
      const pageBlocks = allBlocks.filter((b) => b.page === (c.page ?? 1));
      const needle = normalizeForQuoteMatch(c.quote);
      const hit =
        needle.length > 0
          ? pageBlocks.find((b) => normalizeForQuoteMatch(b.text).includes(needle))
          : undefined;
      const bbox = resolveCitationBboxFromBlocks(c.quote, allBlocks, c.page);
      const documentImage = resolveCitationDocumentImage(
        c.page,
        bbox,
        imagesByDoc.get(c.documentId) ?? []
      );
      return {
        ...c,
        blocks: hit ? [hit] : [],
        bbox,
        documentImage,
      };
    });
  }
}
