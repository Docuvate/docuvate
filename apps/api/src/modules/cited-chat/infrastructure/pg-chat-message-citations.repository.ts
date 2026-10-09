import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type { ExtractionBlock } from '@docuvate/contracts';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';

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
    citations: Array<{
      ordinal: number;
      chunkId: string;
      quote: string;
      charStart: number;
      charEnd: number;
    }>
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
       WHERE document_id = ANY($1::uuid[])`,
      [docIds]
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
      const hit =
        pageBlocks.find((b) => (b.text ?? '').toLowerCase().includes(c.quote.toLowerCase())) ??
        pageBlocks[0] ??
        blocks[0];
      return { ...c, blocks: hit ? [hit] : [] };
    });
  }
}
