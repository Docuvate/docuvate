// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
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
    await this.pool.query(`DELETE FROM chat_message_citations WHERE message_id = $1`, [messageId]);
    for (const c of citations) {
      await this.pool.query(
        `INSERT INTO chat_message_citations (message_id, chunk_id, ordinal, quote, char_start, char_end)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [messageId, c.chunkId, c.ordinal, c.quote, c.charStart, c.charEnd]
      );
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
      });
      byMessage.set(row.message_id, list);
    }
    return byMessage;
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
    return result.rows.map((row) => ({
      ordinal: row.ordinal,
      chunkId: row.chunk_id,
      quote: row.quote,
      charStart: row.char_start,
      charEnd: row.char_end,
      documentId: row.document_id,
      documentTitle: row.title,
      page: row.page,
      blocks: [],
    }));
  }

  async loadHighlightBlocksForCitations(
    citations: StoredChatCitation[]
  ): Promise<StoredChatCitation[]> {
    if (citations.length === 0) {
      return citations;
    }
    const docIds = [...new Set(citations.map((c) => c.documentId))];
    const pages = [...new Set(citations.map((c) => c.page ?? 1))];
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
         AND page = ANY($2::int[])`,
      [docIds, pages]
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
    return citations.map((c) => {
      const blocks = byDoc.get(c.documentId) ?? [];
      const pageBlocks = blocks.filter((b) => b.page === (c.page ?? 1));
      const needle = normalizeForQuoteMatch(c.quote);
      if (!needle) {
        return { ...c, blocks: [] };
      }
      const hit = pageBlocks.find((b) => normalizeForQuoteMatch(b.text).includes(needle));
      return { ...c, blocks: hit ? [hit] : [] };
    });
  }
}
