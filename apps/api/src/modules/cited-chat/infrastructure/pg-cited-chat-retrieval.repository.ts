// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { sanitizeChatThreadDocumentIds } from '../../documents/domain/chat-thread-document-ids.js';
import {
  normalizeSearchText,
  searchTextVariants,
  tokenizeSearchQuery,
} from '../../search/domain/normalize-search-text.js';
import {
  type RankedItem,
  reciprocalRankFusion,
} from '../../search/domain/reciprocal-rank-fusion.js';
import type { ChatAnswerType } from '../domain/chat-answer-type-prototypes.schema.js';
import { libraryAnswerTypeWantsContextualSupplement } from '../domain/chat-answer-type-prototypes.schema.js';
import { RAG_HYBRID_CANDIDATE_LIMIT } from '../domain/cited-chat-constants.js';
import type { CitedChatDocumentContextMeta } from '../domain/cited-chat-structured-context.js';
import { hammingDistance, int8Dot, quantizeQueryVector } from '../domain/int8-retrieval.js';
import {
  libraryContextPeriodPatterns,
  libraryContextSearchTokens,
  libraryContextYearMonths,
} from '../domain/library-context-search-tokens.js';
import { chunkIndexText } from '../domain/split-text-chunks-with-spans.js';

const TRGM_THRESHOLD = 0.32;
const EMPTY_RANKED_ROWS: { id: string; score: number }[] = [];

export interface CitedChatChunkCandidate {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  body: string;
  page: number | null;
  charStart: number | null;
  charEnd: number | null;
  fusionScore: number;
}

@Injectable()
export class PgCitedChatRetrievalRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async loadScopedDocumentChunks(
    userId: string,
    documentIds: string[]
  ): Promise<CitedChatChunkCandidate[]> {
    const scopedDocumentIds = sanitizeChatThreadDocumentIds(documentIds);
    if (scopedDocumentIds.length === 0) {
      return [];
    }

    const chunkRows = await this.pool.query<{
      id: string;
      document_id: string;
      title: string;
      body: string;
      page: number | null;
      char_start: number | null;
      char_end: number | null;
    }>(
      `SELECT c.id, c.document_id, d.title, c.body, c.page, c.char_start, c.char_end
       FROM document_text_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.user_id = $1 AND c.document_id = ANY($2::uuid[])
       ORDER BY c.document_id, c.chunk_index ASC`,
      [userId, scopedDocumentIds]
    );

    if (chunkRows.rows.length > 0) {
      return chunkRows.rows.map((row, index) => ({
        chunkId: row.id,
        documentId: row.document_id,
        documentTitle: row.title,
        body: row.body,
        page: row.page,
        charStart: row.char_start,
        charEnd: row.char_end,
        fusionScore: 1 - index * 0.001,
      }));
    }

    const blockRows = await this.pool.query<{
      document_id: string;
      title: string;
      body: string;
      page: number | null;
    }>(
      `SELECT b.document_id, d.title, string_agg(b.text, ' ' ORDER BY b.position) AS body,
              MIN(b.page) AS page
       FROM document_extraction_blocks b
       JOIN documents d ON d.id = b.document_id
       WHERE d.user_id = $1 AND b.document_id = ANY($2::uuid[])
       GROUP BY b.document_id, d.title
       ORDER BY b.document_id`,
      [userId, scopedDocumentIds]
    );

    return blockRows.rows.map((row, index) => ({
      chunkId: `scoped-block-${row.document_id}`,
      documentId: row.document_id,
      documentTitle: row.title,
      body: row.body,
      page: row.page,
      charStart: null,
      charEnd: null,
      fusionScore: 1 - index * 0.001,
    }));
  }

  async hybridRetrieveChunks(
    userId: string,
    query: string,
    options?: { documentIds?: string[]; queryVector?: number[] }
  ): Promise<CitedChatChunkCandidate[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    const variants = searchTextVariants(trimmed);
    const probe = normalizeSearchText(variants[0] ?? trimmed);
    const trgmProbes = [
      ...new Set([probe, ...tokenizeSearchQuery(trimmed).map(normalizeSearchText)]),
    ].filter((t) => t.length >= 3);

    const scopedDocumentIds = sanitizeChatThreadDocumentIds(options?.documentIds ?? []);
    const docParams = scopedDocumentIds.length > 0 ? [scopedDocumentIds] : [];
    const docFilterAt = (paramIndex: number) =>
      scopedDocumentIds.length > 0
        ? `AND c.document_id = ANY($${String(paramIndex)}::uuid[])`
        : '';

    const ftsPromise =
      probe.length >= 2
        ? this.pool.query<{ id: string; score: number }>(
            `SELECT c.id, ts_rank_cd(c.search_vector, plainto_tsquery('simple', $2::text)) AS score
             FROM document_text_chunks c
             JOIN documents d ON d.id = c.document_id
             WHERE d.user_id = $1
               AND c.search_vector @@ plainto_tsquery('simple', $2::text)
               ${docFilterAt(3)}
             ORDER BY score DESC
             LIMIT ${String(RAG_HYBRID_CANDIDATE_LIMIT)}`,
            [userId, probe, ...docParams]
          )
        : Promise.resolve({ rows: EMPTY_RANKED_ROWS });

    const trgmParams: unknown[] = [userId, trgmProbes, ...docParams, TRGM_THRESHOLD];
    const trgmThresholdIdx = docParams.length > 0 ? 4 : 3;
    const trgmPromise =
      trgmProbes.length > 0
        ? this.pool.query<{ id: string; score: number }>(
            `SELECT c.id,
                    MAX(GREATEST(word_similarity(p.token, c.body), similarity(c.body, p.token))) AS score
             FROM document_text_chunks c
             JOIN documents d ON d.id = c.document_id
             CROSS JOIN unnest($2::text[]) AS p(token)
             WHERE d.user_id = $1
               ${docFilterAt(3)}
             GROUP BY c.id
             HAVING MAX(GREATEST(word_similarity(p.token, c.body), similarity(c.body, p.token))) >= $${String(trgmThresholdIdx)}
             ORDER BY score DESC
             LIMIT ${String(RAG_HYBRID_CANDIDATE_LIMIT)}`,
            trgmParams
          )
        : Promise.resolve({ rows: EMPTY_RANKED_ROWS });

    const [fts, trgm] = await Promise.all([ftsPromise, trgmPromise]);

    const ftsList: RankedItem[] = fts.rows.map((row, i) => ({ id: row.id, rank: i + 1 }));
    const trgmList: RankedItem[] = trgm.rows.map((row, i) => ({ id: row.id, rank: i + 1 }));
    let fused = reciprocalRankFusion([ftsList, trgmList]);

    const queryVector = options?.queryVector;
    if (queryVector && queryVector.length > 0) {
      const corpus = await this.pool.query<{
        id: string;
        vector_scale: number | null;
        vector_int8: Buffer | null;
        binary_code: Buffer | null;
      }>(
        `SELECT c.id, c.vector_scale, c.vector_int8, c.binary_code
         FROM document_text_chunks c
         JOIN documents d ON d.id = c.document_id
         WHERE d.user_id = $1
           AND c.vector_int8 IS NOT NULL
           ${docFilterAt(2)}`,
        [userId, ...docParams]
      );
      const queryInt8 = quantizeQueryVector(queryVector);
      const queryBits = queryInt8.bytes;
      const queryPacked = Buffer.alloc(48);
      for (let i = 0; i < queryBits.length; i += 1) {
        const bit = queryBits.readInt8(i) >= 0 ? 1 : 0;
        const byteIndex = Math.floor(i / 8);
        const bitIndex = 7 - (i % 8);
        queryPacked[byteIndex] |= bit << bitIndex;
      }
      const prefiltered = corpus.rows
        .filter((row) => row.vector_int8 && row.vector_scale != null)
        .map((row) => ({
          id: row.id,
          hamming:
            row.binary_code != null ? hammingDistance(row.binary_code, queryPacked) : 9999,
          scale: row.vector_scale ?? 1,
          bytes: row.vector_int8 ?? Buffer.alloc(0),
        }))
        .sort((a, b) => a.hamming - b.hamming)
        .slice(0, 256);
      const denseList: RankedItem[] = prefiltered
        .map((row) => ({
          id: row.id,
          score: int8Dot(row.scale, row.bytes, queryInt8.scale, queryInt8.bytes),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, RAG_HYBRID_CANDIDATE_LIMIT)
        .map((row, i) => ({ id: row.id, rank: i + 1 }));
      if (denseList.length > 0) {
        fused = reciprocalRankFusion([ftsList, trgmList, denseList]);
      }
    }

    const topIds = [...fused.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, RAG_HYBRID_CANDIDATE_LIMIT)
      .map(([id]) => id);

    if (topIds.length === 0) {
      return this.lexicalFallback(userId, scopedDocumentIds, trimmed);
    }

    const detail = await this.pool.query<{
      id: string;
      document_id: string;
      title: string;
      body: string;
      page: number | null;
      char_start: number | null;
      char_end: number | null;
    }>(
      `SELECT c.id, c.document_id, d.title, c.body, c.page, c.char_start, c.char_end
       FROM document_text_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE c.id = ANY($1::uuid[])`,
      [topIds]
    );

    const byId = new Map(detail.rows.map((r) => [r.id, r]));
    return topIds
      .map((id) => {
        const row = byId.get(id);
        if (!row) {
          return null;
        }
        return {
          chunkId: row.id,
          documentId: row.document_id,
          documentTitle: row.title,
          body: row.body,
          page: row.page,
          charStart: row.char_start,
          charEnd: row.char_end,
          fusionScore: fused.get(id) ?? 0,
        };
      })
      .filter((c): c is CitedChatChunkCandidate => c != null);
  }

  indexPassageForRerank(candidate: CitedChatChunkCandidate): string {
    return chunkIndexText(candidate.documentTitle, candidate.body);
  }

  async listTenantLabelNames(userId: string): Promise<string[]> {
    const result = await this.pool.query<{ name: string }>(
      `SELECT t.name
       FROM tags t
       WHERE t.user_id = $1 AND t.is_inbox = false
       ORDER BY t.name ASC`,
      [userId]
    );
    return result.rows.map((row) => row.name);
  }

  /** Extra hybrid candidates for amount/date questions (token overlap on title/filename/body). */
  /** Documents whose assigned non-inbox labels align with the question embedding. */
  async supplementLabelAlignedLibraryCandidates(
    userId: string,
    alignedLabelNames: readonly string[]
  ): Promise<CitedChatChunkCandidate[]> {
    const names = [...new Set(alignedLabelNames.map((name) => name.trim()).filter(Boolean))];
    if (names.length === 0) {
      return [];
    }

    const rows = await this.pool.query<{
      id: string;
      document_id: string;
      title: string;
      body: string;
      page: number | null;
      char_start: number | null;
      char_end: number | null;
    }>(
      `SELECT c.id, c.document_id, d.title, c.body, c.page, c.char_start, c.char_end
       FROM document_text_chunks c
       JOIN documents d ON d.id = c.document_id
       JOIN document_tags dt ON dt.document_id = d.id
       JOIN tags t ON t.id = dt.tag_id
       WHERE d.user_id = $1
         AND t.is_inbox = false
         AND t.name = ANY($2::text[])
       ORDER BY d.updated_at DESC, c.chunk_index ASC
       LIMIT ${String(RAG_HYBRID_CANDIDATE_LIMIT)}`,
      [userId, names]
    );

    if (rows.rows.length > 0) {
      return rows.rows.map((row, index) => ({
        chunkId: row.id,
        documentId: row.document_id,
        documentTitle: row.title,
        body: row.body,
        page: row.page,
        charStart: row.char_start,
        charEnd: row.char_end,
        fusionScore: 0.92 - index * 0.001,
      }));
    }

    const blockRows = await this.pool.query<{
      document_id: string;
      title: string;
      body: string;
      page: number | null;
    }>(
      `SELECT b.document_id, d.title, string_agg(b.text, ' ' ORDER BY b.position) AS body,
              MIN(b.page) AS page
       FROM document_extraction_blocks b
       JOIN documents d ON d.id = b.document_id
       JOIN document_tags dt ON dt.document_id = d.id
       JOIN tags t ON t.id = dt.tag_id
       WHERE d.user_id = $1
         AND t.is_inbox = false
         AND t.name = ANY($2::text[])
       GROUP BY b.document_id, d.title
       ORDER BY d.updated_at DESC
       LIMIT ${String(RAG_HYBRID_CANDIDATE_LIMIT)}`,
      [userId, names]
    );

    return blockRows.rows.map((row, index) => ({
      chunkId: `label-aligned-block-${row.document_id}`,
      documentId: row.document_id,
      documentTitle: row.title,
      body: row.body,
      page: row.page,
      charStart: null,
      charEnd: null,
      fusionScore: 0.92 - index * 0.001,
    }));
  }

  async supplementContextualLibraryCandidates(
    userId: string,
    query: string,
    answerType: ChatAnswerType
  ): Promise<CitedChatChunkCandidate[]> {
    if (!libraryAnswerTypeWantsContextualSupplement(answerType)) {
      return [];
    }
    const tokens = libraryContextSearchTokens(query);
    if (tokens.length === 0) {
      return [];
    }
    const patterns = tokens.map((token) => `%${token}%`);
    const periodPatterns = libraryContextPeriodPatterns(tokens);
    const periodKeys = libraryContextYearMonths(query).map(
      ({ month, year }) => `${year}-${month}`
    );

    const rows = await this.pool.query<{
      id: string;
      document_id: string;
      title: string;
      filename: string;
      body: string;
      page: number | null;
      char_start: number | null;
      char_end: number | null;
    }>(
      `SELECT c.id, c.document_id, d.title, d.filename, c.body, c.page, c.char_start, c.char_end
       FROM document_text_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.user_id = $1
         AND (
           d.filename ILIKE ANY($2::text[])
           OR d.title ILIKE ANY($2::text[])
           OR c.body ILIKE ANY($2::text[])
         )
         ${
           periodPatterns.length > 0 || periodKeys.length > 0
             ? `AND (
           d.filename ILIKE ANY($3::text[])
           OR d.title ILIKE ANY($3::text[])
           OR c.body ILIKE ANY($3::text[])
           ${
             periodKeys.length > 0
               ? `OR to_char(d.document_date, 'YYYY-MM') = ANY($4::text[])`
               : ''
           }
         )`
             : ''
         }
       ORDER BY c.document_id, c.chunk_index ASC
       LIMIT ${String(RAG_HYBRID_CANDIDATE_LIMIT * 2)}`,
      periodPatterns.length > 0 && periodKeys.length > 0
        ? [userId, patterns, periodPatterns, periodKeys]
        : periodPatterns.length > 0
          ? [userId, patterns, periodPatterns]
          : periodKeys.length > 0
            ? [userId, patterns, [], periodKeys]
            : [userId, patterns]
    );

    return rows.rows.slice(0, RAG_HYBRID_CANDIDATE_LIMIT).map((row, index) => ({
      chunkId: row.id,
      documentId: row.document_id,
      documentTitle: row.title,
      body: row.body,
      page: row.page,
      charStart: row.char_start,
      charEnd: row.char_end,
      fusionScore: 0.5 - index * 0.001,
    }));
  }

  async loadDocumentContextMeta(
    userId: string,
    documentIds: string[]
  ): Promise<Map<string, CitedChatDocumentContextMeta>> {
    const unique = [...new Set(documentIds)].filter((id) => id.length > 0);
    const out = new Map<string, CitedChatDocumentContextMeta>();
    if (unique.length === 0) {
      return out;
    }

    const docs = await this.pool.query<{
      id: string;
      title: string;
      filename: string;
      document_date: string | null;
    }>(
      `SELECT d.id, d.title, d.filename, d.document_date::text AS document_date
       FROM documents d
       WHERE d.user_id = $1 AND d.id = ANY($2::uuid[])`,
      [userId, unique]
    );

    const tags = await this.pool.query<{ document_id: string; name: string }>(
      `SELECT dt.document_id, t.name
       FROM document_tags dt
       JOIN tags t ON t.id = dt.tag_id
       JOIN documents d ON d.id = dt.document_id
       WHERE d.user_id = $1 AND dt.document_id = ANY($2::uuid[])
       ORDER BY t.name ASC`,
      [userId, unique]
    );

    const fields = await this.pool.query<{
      document_id: string;
      field_storage_key: string;
      value_text: string;
      confidence: number | null;
    }>(
      `SELECT v.document_id, v.field_storage_key, v.value_text, v.confidence
       FROM document_field_values v
       JOIN documents d ON d.id = v.document_id
       WHERE d.user_id = $1 AND v.document_id = ANY($2::uuid[])
       ORDER BY v.document_id, v.field_storage_key`,
      [userId, unique]
    );

    const labelsByDoc = new Map<string, string[]>();
    for (const row of tags.rows) {
      const list = labelsByDoc.get(row.document_id) ?? [];
      list.push(row.name);
      labelsByDoc.set(row.document_id, list);
    }

    const fieldsByDoc = new Map<string, CitedChatDocumentContextMeta['fields']>();
    for (const row of fields.rows) {
      const list = fieldsByDoc.get(row.document_id) ?? [];
      list.push({
        key: row.field_storage_key,
        value: row.value_text,
        confidence: row.confidence,
      });
      fieldsByDoc.set(row.document_id, list);
    }

    for (const row of docs.rows) {
      out.set(row.id, {
        documentId: row.id,
        title: row.title,
        filename: row.filename,
        documentDate: row.document_date,
        labels: labelsByDoc.get(row.id) ?? [],
        fields: fieldsByDoc.get(row.id) ?? [],
      });
    }
    return out;
  }

  private async lexicalFallback(
    userId: string,
    documentIds: string[],
    query: string
  ): Promise<CitedChatChunkCandidate[]> {
    const tokens = tokenizeSearchQuery(query).map(normalizeSearchText).filter((t) => t.length >= 2);
    if (tokens.length === 0) {
      return [];
    }

    const scopedIds = sanitizeChatThreadDocumentIds(documentIds);
    const docFilter = scopedIds.length > 0 ? 'AND c.document_id = ANY($2::uuid[])' : '';
    const chunkParams = scopedIds.length > 0 ? [userId, scopedIds] : [userId];

    const chunkRows = await this.pool.query<{
      id: string;
      document_id: string;
      title: string;
      body: string;
      page: number | null;
      char_start: number | null;
      char_end: number | null;
    }>(
      `SELECT c.id, c.document_id, d.title, c.body, c.page, c.char_start, c.char_end
       FROM document_text_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.user_id = $1 ${docFilter}
       ORDER BY c.chunk_index ASC
       LIMIT 200`,
      chunkParams
    );

    let bodies = chunkRows.rows;
    if (bodies.length === 0) {
      const blockFilter = scopedIds.length > 0 ? 'AND b.document_id = ANY($2::uuid[])' : '';
      const blockParams = scopedIds.length > 0 ? [userId, scopedIds] : [userId];
      const blockRows = await this.pool.query<{
        document_id: string;
        title: string;
        body: string;
        page: number | null;
      }>(
        `SELECT b.document_id, d.title, string_agg(b.text, ' ' ORDER BY b.position) AS body,
                MIN(b.page) AS page
         FROM document_extraction_blocks b
         JOIN documents d ON d.id = b.document_id
         WHERE d.user_id = $1 ${blockFilter}
         GROUP BY b.document_id, d.title`,
        blockParams
      );
      bodies = blockRows.rows.map((row, index) => ({
        id: `lexical-block-${row.document_id}-${String(index)}`,
        document_id: row.document_id,
        title: row.title,
        body: row.body,
        page: row.page,
        char_start: null,
        char_end: null,
      }));
    }

    const scored = bodies
      .map((row) => {
        const normalizedBody = normalizeSearchText(row.body);
        let hits = 0;
        for (const token of tokens) {
          if (normalizedBody.includes(token)) {
            hits += 1;
          }
        }
        if (hits === 0) {
          return null;
        }
        const density = hits / tokens.length;
        return {
          chunkId: row.id,
          documentId: row.document_id,
          documentTitle: row.title,
          body: row.body,
          page: row.page,
          charStart: row.char_start,
          charEnd: row.char_end,
          fusionScore: density,
        };
      })
      .filter((row): row is CitedChatChunkCandidate => row != null)
      .sort((a, b) => b.fusionScore - a.fusionScore)
      .slice(0, RAG_HYBRID_CANDIDATE_LIMIT);

    return scored;
  }
}
