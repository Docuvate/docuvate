// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { sanitizeChatThreadDocumentIds } from '../../documents/domain/chat-thread-document-ids.js';
import { cosineSimilarity } from '../../search/domain/cosine-similarity.js';
import {
  normalizeSearchText,
  searchTextVariants,
  tokenizeSearchQuery,
} from '../../search/domain/normalize-search-text.js';
import {
  type RankedItem,
  reciprocalRankFusion,
} from '../../search/domain/reciprocal-rank-fusion.js';
import { RAG_HYBRID_CANDIDATE_LIMIT } from '../domain/cited-chat-constants.js';
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

function parseEmbedding(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const nums = raw.map((v) => Number(v));
  if (nums.some((n) => !Number.isFinite(n))) {
    return null;
  }
  return nums;
}

@Injectable()
export class PgCitedChatRetrievalRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

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
    const docFilter = scopedDocumentIds.length > 0 ? `AND c.document_id = ANY($3::uuid[])` : '';
    const docParams = scopedDocumentIds.length > 0 ? [scopedDocumentIds] : [];

    const ftsPromise =
      probe.length >= 2
        ? this.pool.query<{ id: string; score: number }>(
            `SELECT c.id, ts_rank_cd(c.search_vector, plainto_tsquery('simple', $2::text)) AS score
             FROM document_text_chunks c
             JOIN documents d ON d.id = c.document_id
             WHERE d.user_id = $1
               AND c.search_vector @@ plainto_tsquery('simple', $2::text)
               ${docFilter}
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
               ${docFilter}
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
      const candidateIds = [...fused.keys()];
      if (candidateIds.length > 0) {
        const embedRows = await this.pool.query<{ id: string; embedding: unknown; body: string }>(
          `SELECT c.id, c.embedding, c.body
           FROM document_text_chunks c
           JOIN documents d ON d.id = c.document_id
           WHERE d.user_id = $1 AND c.id = ANY($2::uuid[])`,
          [userId, candidateIds]
        );
        const denseList: RankedItem[] = embedRows.rows
          .map((row) => {
            const vec = parseEmbedding(row.embedding);
            if (!vec) {
              return null;
            }
            const score = cosineSimilarity(queryVector, vec);
            return { id: row.id, score };
          })
          .filter((row): row is { id: string; score: number } => row != null)
          .sort((a, b) => b.score - a.score)
          .map((row, i) => ({ id: row.id, rank: i + 1 }));
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
        id: `lexical-block-${row.document_id}-${index}`,
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
