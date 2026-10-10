// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { expandQueryTerms } from '../domain/expand-query-terms.js';
import {
  buildHighlightTerms,
  highlightFuzzyMatches,
  snippetAroundMatch,
} from '../domain/highlight-fuzzy.js';
import {
  normalizeSearchText,
  searchTextVariants,
  tokenizeSearchQuery,
} from '../domain/normalize-search-text.js';
import type { GlobalSearchRepositoryResult } from '../domain/global-search.types.js';
import { reciprocalRankFusion, type RankedItem } from '../domain/reciprocal-rank-fusion.js';
import type { TextChunkSpan } from '../../cited-chat/domain/split-text-chunks-with-spans.js';
import { cosineSimilarity } from '../domain/cosine-similarity.js';
import { DocumentEmbeddingVectorCache } from './document-embedding-vector.cache.js';
import type { ResolvedFieldFilter } from '../domain/resolve-field-definition.js';
import { parseQueryScalarProbe } from '../domain/normalize-field-value.js';
import {
  defaultFieldLabel,
  loadFieldDefinitionLookup,
  type FieldDefinitionLookup,
} from './document-field-value-index.js';
import type { SearchFieldDefinitionRow } from '../domain/resolve-field-definition.js';

const TRGM_THRESHOLD = 0.32;
const WORD_SIM_THRESHOLD = 0.32;
const PER_GROUP_LIMIT = 8;
const LEXICAL_CANDIDATE_CAP = 64;
const EMBED_CANDIDATE_CAP = Number(process.env['GLOBAL_SEARCH_EMBED_CANDIDATE_CAP'] ?? 24);

/** pg_advisory_xact_lock class id for document_text_chunks reindex (per document_id). */
const DOCUMENT_TEXT_CHUNK_INDEX_LOCK_HI = 0x44544348;

function documentTextChunkIndexLockKey(documentId: string): { high: number; low: number } {
  const hex = documentId.replace(/-/g, '');
  const low = Number.parseInt(hex.slice(0, 8), 16) | 0;
  return { high: DOCUMENT_TEXT_CHUNK_INDEX_LOCK_HI, low };
}

function escapeTsToken(term: string): string {
  return term.replace(/[&|!():*'"]/g, ' ').trim();
}

function buildTrgmProbes(variantQueries: string[]): string[] {
  const probes = new Set<string>();
  for (const v of variantQueries) {
    const folded = normalizeSearchText(v);
    if (folded.length >= 3) probes.add(folded);
    for (const token of tokenizeSearchQuery(v)) {
      const t = normalizeSearchText(token);
      if (t.length >= 3) probes.add(t);
    }
  }
  return [...probes];
}

function buildTsQuery(terms: string[]): string | null {
  const parts = terms
    .map(escapeTsToken)
    .filter((t) => t.length >= 2)
    .map((t) => `${t}:*`);
  if (parts.length === 0) return null;
  return parts.join(' | ');
}

@Injectable()
export class PgGlobalSearchRepository {
  private readonly embeddingCache = new DocumentEmbeddingVectorCache();

  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listFieldDefinitions(userId: string): Promise<SearchFieldDefinitionRow[]> {
    const lookup = await loadFieldDefinitionLookup(this.pool, userId);
    return [...lookup.values()].map((row) => {
      const key = row.storageKey.startsWith('global:')
        ? row.storageKey.slice('global:'.length)
        : (row.storageKey.split(':').pop() ?? row.storageKey);
      return {
        storageKey: row.storageKey,
        key,
        label: row.label,
        fieldType: row.fieldType,
      };
    });
  }

  async userHasDocumentEmbeddings(userId: string): Promise<boolean> {
    const row = await this.pool.query<{ ok: number }>(
      `SELECT 1 AS ok
       FROM document_embeddings e
       JOIN documents d ON d.id = e.document_id
       WHERE d.user_id = $1
       LIMIT 1`,
      [userId]
    );
    return row.rows.length > 0;
  }

  async indexDocumentChunks(
    userId: string,
    documentId: string,
    chunks: TextChunkSpan[],
    embeddings?: number[][] | undefined
  ): Promise<void> {
    const client = await this.pool.connect();
    const lockKey = documentTextChunkIndexLockKey(documentId);
    try {
      await client.query('BEGIN');
      await client.query(`SELECT pg_advisory_xact_lock($1, $2)`, [lockKey.high, lockKey.low]);
      await client.query(`DELETE FROM document_text_chunks WHERE document_id = $1`, [documentId]);
      for (let i = 0; i < chunks.length; i += 1) {
        const chunk = chunks[i]!;
        const embeddingJson = embeddings?.[i] != null ? JSON.stringify(embeddings[i]) : null;
        await client.query(
          `INSERT INTO document_text_chunks (
             document_id, chunk_index, body, page, char_start, char_end, embedding, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, now())`,
          [documentId, i, chunk.body, chunk.page, chunk.charStart, chunk.charEnd, embeddingJson]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    for (const chunk of chunks) {
      await this.upsertVocabularyTerms(userId, chunk.body, 'chunk');
    }
    const fullText = chunks.map((c) => c.body).join(' ');
    await this.upsertVocabularyTerms(userId, fullText.slice(0, 4000), 'document');
  }

  async upsertVocabularyTerms(
    userId: string,
    text: string,
    source: 'document' | 'chunk'
  ): Promise<void> {
    const tokens = tokenizeSearchQuery(text);
    const unique = [...new Set(tokens)].filter((t) => t.length >= 3 && t.length <= 48);
    if (unique.length === 0) return;
    for (const term of unique.slice(0, 200)) {
      await this.pool.query(
        `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, term) DO UPDATE SET doc_frequency = search_vocabulary_terms.doc_frequency + 1`,
        [userId, term, source]
      );
    }
  }

  async findSimilarVocabularyTerms(
    userId: string,
    token: string,
    limit: number
  ): Promise<Array<{ term: string; similarity: number }>> {
    const variants = searchTextVariants(token);
    const probe = normalizeSearchText(variants[0] ?? token);
    const result = await this.pool.query<{ term: string; sim: number }>(
      `WITH corpus AS (
         SELECT term FROM search_vocabulary_terms WHERE user_id = $1 AND length(term) >= 3
         UNION
         SELECT DISTINCT unnest(
           regexp_split_to_array(unaccent(lower(coalesce(v.value_text_norm, v.value_text, ''))), '\\s+')
         ) AS term
         FROM document_field_values v
         JOIN documents fd ON fd.id = v.document_id
         WHERE fd.user_id = $1
         UNION
         SELECT DISTINCT unnest(
           regexp_split_to_array(unaccent(lower(coalesce(d.title, ''))), '[^[:alnum:]]+')
         ) AS term
         FROM documents d WHERE d.user_id = $1
         UNION
         SELECT DISTINCT unnest(
           regexp_split_to_array(unaccent(lower(coalesce(d.filename, ''))), '[^[:alnum:]]+')
         ) AS term
         FROM documents d WHERE d.user_id = $1
         UNION
         SELECT DISTINCT unnest(
           regexp_split_to_array(unaccent(lower(coalesce(c.body, ''))), '[^[:alnum:]]+')
         ) AS term
         FROM document_text_chunks c
         JOIN documents cd ON cd.id = c.document_id
         WHERE cd.user_id = $1
       )
       SELECT term,
              GREATEST(
                similarity(unaccent(lower(term)), unaccent(lower($2::text))),
                word_similarity(unaccent(lower($2::text)), term)
              ) AS sim
       FROM corpus
       WHERE term IS NOT NULL AND length(term) >= 3
         AND (
           similarity(unaccent(lower(term)), unaccent(lower($2::text))) >= 0.28
           OR word_similarity(unaccent(lower($2::text)), term) >= 0.28
           OR unaccent(lower(term)) % unaccent(lower($2::text))
           OR unaccent(lower($2::text)) % unaccent(lower(term))
         )
       ORDER BY sim DESC
       LIMIT $3`,
      [userId, probe, limit]
    );
    return result.rows.map((r) => ({ term: r.term, similarity: Number(r.sim) }));
  }

  async search(
    userId: string,
    rawQuery: string,
    options: {
      perGroupLimit?: number;
      includeDocuments?: boolean;
      includeFolders?: boolean;
      includeLabels?: boolean;
      queryVector?: number[];
      embedFullScan?: boolean;
      fieldFilters?: ResolvedFieldFilter[];
    }
  ): Promise<GlobalSearchRepositoryResult> {
    const perGroup = options.perGroupLimit ?? PER_GROUP_LIMIT;
    const q = rawQuery.trim();
    const queryTokens = tokenizeSearchQuery(q);
    const { expanded } = await expandQueryTerms(q, (token, limit) =>
      this.findSimilarVocabularyTerms(userId, token, limit)
    );
    const variantQueries = [...new Set([...searchTextVariants(q), ...expanded])].filter(Boolean);
    const highlightTerms = buildHighlightTerms(queryTokens, expanded);
    const tsQuery = buildTsQuery([...queryTokens, ...expanded]);

    let documentTotal = 0;
    let folderTotal = 0;
    let labelTotal = 0;
    const documents: GlobalSearchRepositoryResult['documents'] = [];
    const folders: GlobalSearchRepositoryResult['folders'] = [];
    const labels: GlobalSearchRepositoryResult['labels'] = [];

    const fieldFilters = options.fieldFilters ?? [];
    if (options.includeDocuments !== false && (q.length > 0 || fieldFilters.length > 0)) {
      const docResult = await this.searchDocuments(
        userId,
        q,
        variantQueries,
        tsQuery,
        queryTokens,
        highlightTerms,
        perGroup,
        options.queryVector,
        options.embedFullScan === true,
        fieldFilters
      );
      documents.push(...docResult.items);
      documentTotal = docResult.total;
    }

    if (options.includeFolders && q.length > 0) {
      const folderRows = await this.searchFolders(userId, q, variantQueries, queryTokens, perGroup);
      folders.push(...folderRows.items);
      folderTotal = folderRows.items.length;
    }
    if (options.includeLabels && q.length > 0) {
      const labelRows = await this.searchLabels(userId, q, variantQueries, queryTokens, perGroup);
      labels.push(...labelRows.items);
      labelTotal = labelRows.items.length;
    }

    return {
      documents,
      folders,
      labels,
      expandedTerms: expanded,
      documentTotal,
      folderTotal,
      labelTotal,
    };
  }

  private async searchDocuments(
    userId: string,
    q: string,
    variantQueries: string[],
    tsQuery: string | null,
    queryTokens: string[],
    highlightTerms: string[],
    limit: number,
    queryVector?: number[],
    embedFullScan = false,
    fieldFilters: ResolvedFieldFilter[] = []
  ): Promise<{ items: GlobalSearchRepositoryResult['documents']; total: number }> {
    const trgmProbes = buildTrgmProbes(variantQueries);
    const probe = trgmProbes[0] ?? normalizeSearchText(variantQueries[0] ?? q);
    const chunkSnippets = new Map<string, string>();
    const fieldLeg = await this.searchFieldValueLeg(
      userId,
      q,
      queryTokens,
      probe,
      fieldFilters,
      trgmProbes
    );

    const ftsPromise = tsQuery
      ? this.pool.query<{ id: string }>(
          `SELECT d.id
           FROM documents d
           WHERE d.user_id = $1
             AND d.search_vector @@ to_tsquery('simple', $2)
           ORDER BY ts_rank_cd(d.search_vector, to_tsquery('simple', $2)) DESC
           LIMIT 40`,
          [userId, tsQuery]
        )
      : Promise.resolve({ rows: [] as { id: string }[] });

    const trgmPromise =
      trgmProbes.length > 0
        ? this.pool.query<{ id: string; score: number }>(
            `SELECT d.id,
                    MAX(GREATEST(
                      word_similarity(p.token, d.title),
                      word_similarity(p.token, d.filename),
                      similarity(d.title, p.token),
                      similarity(d.filename, p.token)
                    )) AS score
             FROM documents d
             CROSS JOIN unnest($2::text[]) AS p(token)
             WHERE d.user_id = $1
             GROUP BY d.id
             HAVING MAX(GREATEST(
               word_similarity(p.token, d.title),
               word_similarity(p.token, d.filename)
             )) >= $3
             ORDER BY score DESC
             LIMIT 32`,
            [userId, trgmProbes, WORD_SIM_THRESHOLD]
          )
        : Promise.resolve({ rows: [] as { id: string; score: number }[] });

    const chunkProbe = queryTokens[0] ?? probe;
    const chunkFtsPromise =
      chunkProbe.length >= 3
        ? this.pool.query<{ document_id: string; body: string; score: number }>(
            `SELECT c.document_id, c.body, ts_rank_cd(c.search_vector, plainto_tsquery('simple', $2::text)) AS score
             FROM document_text_chunks c
             JOIN documents cd ON cd.id = c.document_id
             WHERE cd.user_id = $1
               AND c.search_vector @@ plainto_tsquery('simple', $2::text)
             ORDER BY score DESC
             LIMIT 32`,
            [userId, chunkProbe]
          )
        : Promise.resolve({ rows: [] as { document_id: string; body: string; score: number }[] });

    const chunkTrgmPromise =
      trgmProbes.length > 0
        ? this.pool.query<{ document_id: string; body: string; score: number }>(
            `SELECT c.document_id, c.body,
                    MAX(GREATEST(word_similarity(p.token, c.body), similarity(c.body, p.token))) AS score
             FROM document_text_chunks c
             JOIN documents cd ON cd.id = c.document_id
             CROSS JOIN unnest($2::text[]) AS p(token)
             WHERE cd.user_id = $1
             GROUP BY c.document_id, c.body
             HAVING MAX(GREATEST(word_similarity(p.token, c.body), similarity(c.body, p.token))) >= $3
             ORDER BY score DESC
             LIMIT 32`,
            [userId, trgmProbes, WORD_SIM_THRESHOLD]
          )
        : Promise.resolve({ rows: [] as { document_id: string; body: string; score: number }[] });

    const [fts, trgm, chunks, chunkTrgm] = await Promise.all([
      ftsPromise,
      trgmPromise,
      chunkFtsPromise,
      chunkTrgmPromise,
    ]);

    const ftsList: RankedItem[] = fts.rows.map((row, i) => ({ id: row.id, rank: i + 1 }));
    const trgmTitleList: RankedItem[] = trgm.rows.map((row, i) => ({ id: row.id, rank: i + 1 }));
    const chunkFtsList: RankedItem[] = chunks.rows.map((row, i) => ({
      id: row.document_id,
      rank: i + 1,
    }));
    const chunkTrgmList: RankedItem[] = chunkTrgm.rows.map((row, i) => ({
      id: row.document_id,
      rank: i + 1,
    }));
    for (const row of [...chunks.rows, ...chunkTrgm.rows]) {
      if (!chunkSnippets.has(row.document_id)) {
        chunkSnippets.set(row.document_id, row.body);
      }
    }

    let fused = reciprocalRankFusion([
      ftsList,
      trgmTitleList,
      chunkFtsList,
      chunkTrgmList,
      fieldLeg.ranks,
    ]);

    if (queryVector && queryVector.length > 0) {
      const lexicalCandidates = [...fused.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(0, embedFullScan ? 10_000 : EMBED_CANDIDATE_CAP);
      const vectorRanks = await this.rankDocumentsByEmbedding(
        userId,
        queryVector,
        30,
        embedFullScan ? null : lexicalCandidates
      );
      const lexicalOrdered = [...fused.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id], i) => ({ id, rank: i + 1 }));
      fused = reciprocalRankFusion([lexicalOrdered, vectorRanks]);
    }

    const rankedIds = [...fused.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, Math.max(limit, 50));

    if (rankedIds.length === 0) {
      return { items: [], total: 0 };
    }

    const details = await this.pool.query(
      `SELECT d.id, d.title, d.filename, d.extracted_text, d.document_date, d.updated_at,
              f.name AS folder_name
       FROM documents d
       LEFT JOIN folders f ON f.id = d.folder_id
       WHERE d.user_id = $1 AND d.id = ANY($2::uuid[])
       ORDER BY array_position($2::uuid[], d.id)`,
      [userId, rankedIds]
    );

    const byId = new Map(details.rows.map((r) => [String(r['id']), r]));
    const items: GlobalSearchRepositoryResult['documents'] = [];
    for (const id of rankedIds.slice(0, limit)) {
      const row = byId.get(id);
      if (!row) continue;
      const title = String(row['title'] ?? '');
      const filename = String(row['filename'] ?? '');
      const extracted = String(row['extracted_text'] ?? '');
      const fieldHit = fieldLeg.snippets.get(id);
      const snippetSource = fieldHit
        ? fieldHit.valueText
        : (chunkSnippets.get(id) ?? extracted.slice(0, 240) ?? title);
      const titleHighlightSpans = highlightFuzzyMatches(title, highlightTerms);
      const sourceHighlightSpans = highlightFuzzyMatches(snippetSource, highlightTerms);
      const snippet = snippetAroundMatch(snippetSource, sourceHighlightSpans);
      const snippetHighlightSpans = highlightFuzzyMatches(snippet, highlightTerms);
      items.push({
        id,
        title,
        filename,
        extractedText: extracted,
        folderPath: row['folder_name'] != null ? String(row['folder_name']) : null,
        labelNames: [],
        documentDate: row['document_date'] != null ? String(row['document_date']) : null,
        updatedAt: new Date(String(row['updated_at'])).toISOString(),
        snippetText: snippet,
        matchedFieldLabel: fieldHit?.fieldLabel ?? null,
        highlightSpans: titleHighlightSpans,
        snippetHighlightSpans,
        score: fused.get(id) ?? 0,
      });
    }

    return { items, total: rankedIds.length };
  }

  private async searchFieldValueLeg(
    userId: string,
    q: string,
    queryTokens: string[],
    probe: string,
    fieldFilters: ResolvedFieldFilter[],
    trgmProbes: string[] = []
  ): Promise<{
    ranks: RankedItem[];
    snippets: Map<string, { fieldLabel: string; valueText: string }>;
  }> {
    const snippets = new Map<string, { fieldLabel: string; valueText: string }>();
    const scored = new Map<string, number>();

    const register = (documentId: string, fieldLabel: string, valueText: string, score: number) => {
      const prev = scored.get(documentId) ?? 0;
      if (score >= prev) {
        scored.set(documentId, score);
        snippets.set(documentId, { fieldLabel, valueText });
      }
    };

    const textProbes = new Set<string>(trgmProbes);
    if (probe.length >= 3) textProbes.add(probe);
    for (const token of queryTokens) {
      const t = normalizeSearchText(token);
      if (t.length >= 3) textProbes.add(t);
    }

    const textQueries: Array<
      Promise<{
        rows: Array<{
          document_id: string;
          field_storage_key: string;
          value_text: string;
          score: number;
        }>;
      }>
    > = [];
    for (const textProbe of textProbes) {
      textQueries.push(
        this.pool.query(
          `SELECT v.document_id, v.field_storage_key, v.value_text,
                  GREATEST(
                    word_similarity($2::text, v.value_text_norm),
                    word_similarity($2::text, v.value_text)
                  ) AS score
           FROM document_field_values v
           JOIN documents fd ON fd.id = v.document_id
           WHERE fd.user_id = $1
             AND v.value_text_norm IS NOT NULL
             AND GREATEST(
               word_similarity($2::text, v.value_text_norm),
               word_similarity($2::text, v.value_text)
             ) >= $3
           ORDER BY score DESC
           LIMIT 32`,
          [userId, textProbe, WORD_SIM_THRESHOLD]
        )
      );
    }

    const freeScalar = fieldFilters.length === 0 ? parseQueryScalarProbe(q) : null;
    if (freeScalar?.numeric != null) {
      textQueries.push(
        this.pool.query(
          `SELECT v.document_id, v.field_storage_key, v.value_text, 1::float8 AS score
           FROM document_field_values v
           JOIN documents fd ON fd.id = v.document_id
           WHERE fd.user_id = $1
             AND v.value_numeric IS NOT NULL
             AND v.value_numeric = $2`,
          [userId, freeScalar.numeric]
        )
      );
    }
    if (freeScalar?.dateIso) {
      textQueries.push(
        this.pool.query(
          `SELECT v.document_id, v.field_storage_key, v.value_text, 1::float8 AS score
           FROM document_field_values v
           JOIN documents fd ON fd.id = v.document_id
           WHERE fd.user_id = $1
             AND v.value_date IS NOT NULL
             AND v.value_date = $2::date`,
          [userId, freeScalar.dateIso]
        )
      );
    }

    for (const filter of fieldFilters) {
      const scalar = parseQueryScalarProbe(filter.valueRaw);
      if (scalar.numeric != null) {
        textQueries.push(
          this.pool.query(
            `SELECT v.document_id, v.field_storage_key, v.value_text, 1::float8 AS score
             FROM document_field_values v
             JOIN documents fd ON fd.id = v.document_id
             WHERE fd.user_id = $1
               AND v.value_numeric IS NOT NULL
               AND v.value_numeric = $2
               AND v.field_storage_key = ANY($3::text[])`,
            [userId, scalar.numeric, filter.storageKeys]
          )
        );
      } else if (scalar.dateIso) {
        textQueries.push(
          this.pool.query(
            `SELECT v.document_id, v.field_storage_key, v.value_text, 1::float8 AS score
             FROM document_field_values v
             JOIN documents fd ON fd.id = v.document_id
             WHERE fd.user_id = $1
               AND v.value_date IS NOT NULL
               AND v.value_date = $2::date
               AND ($3::text[] IS NULL OR v.field_storage_key = ANY($3::text[]))`,
            [userId, scalar.dateIso, filter.storageKeys]
          )
        );
      } else if (scalar.textProbe.length >= 2) {
        textQueries.push(
          this.pool.query(
            `SELECT v.document_id, v.field_storage_key, v.value_text,
                    GREATEST(
                      word_similarity($3::text, v.value_text_norm),
                      word_similarity($3::text, v.value_text)
                    ) AS score
             FROM document_field_values v
             JOIN documents fd ON fd.id = v.document_id
             WHERE fd.user_id = $1
               AND v.value_text_norm IS NOT NULL
               AND v.field_storage_key = ANY($2::text[])
               AND (
                 $3::text <% v.value_text_norm
                 OR v.value_text_norm %> $3::text
               )
             ORDER BY score DESC
             LIMIT 32`,
            [userId, filter.storageKeys, scalar.textProbe]
          )
        );
      }
    }

    const [results, definitions] = await Promise.all([
      Promise.all(textQueries),
      textQueries.length > 0
        ? loadFieldDefinitionLookup(this.pool, userId)
        : Promise.resolve(new Map<string, FieldDefinitionLookup>()),
    ]);
    for (const result of results) {
      for (const row of result.rows) {
        const storageKey = String(row.field_storage_key);
        register(
          String(row.document_id),
          definitions.get(storageKey)?.label ?? defaultFieldLabel(storageKey),
          String(row.value_text),
          Number(row.score ?? 0)
        );
      }
    }

    const ranks: RankedItem[] = [...scored.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id], index) => ({ id, rank: index + 1 }));

    return { ranks, snippets };
  }

  private async searchFolders(
    userId: string,
    q: string,
    variantQueries: string[],
    queryTokens: string[],
    limit: number
  ): Promise<{ items: GlobalSearchRepositoryResult['folders'] }> {
    const probe = variantQueries[0] ?? q;
    const result = await this.pool.query(
      `SELECT f.id, f.name,
              COUNT(d.id)::int AS document_count,
              similarity(f.name, $2) AS score
       FROM folders f
       LEFT JOIN documents d ON d.folder_id = f.id AND d.user_id = f.user_id
       WHERE f.user_id = $1
         AND (
           unaccent(lower(f.name)) % unaccent(lower($2::text))
           OR similarity(unaccent(lower(f.name)), unaccent(lower($2::text))) > $3
         )
       GROUP BY f.id
       ORDER BY score DESC
       LIMIT $4`,
      [userId, probe, TRGM_THRESHOLD, limit]
    );
    return {
      items: result.rows.map((row) => {
        const name = String(row['name']);
        return {
          id: String(row['id']),
          name,
          path: name,
          documentCount: Number(row['document_count'] ?? 0),
          highlightSpans: highlightFuzzyMatches(name, queryTokens),
          score: Number(row['score'] ?? 0),
        };
      }),
    };
  }

  private async searchLabels(
    userId: string,
    q: string,
    variantQueries: string[],
    queryTokens: string[],
    limit: number
  ): Promise<{ items: GlobalSearchRepositoryResult['labels'] }> {
    const probe = variantQueries[0] ?? q;
    const result = await this.pool.query(
      `SELECT t.id, t.name, t.color,
              COUNT(dt.document_id)::int AS document_count,
              similarity(t.name, $2) AS score
       FROM tags t
       LEFT JOIN document_tags dt ON dt.tag_id = t.id
       WHERE t.user_id = $1
         AND (
           unaccent(lower(t.name)) % unaccent(lower($2::text))
           OR similarity(unaccent(lower(t.name)), unaccent(lower($2::text))) > $3
         )
       GROUP BY t.id
       ORDER BY score DESC
       LIMIT $4`,
      [userId, probe, TRGM_THRESHOLD, limit]
    );
    return {
      items: result.rows.map((row) => {
        const name = String(row['name']);
        return {
          id: String(row['id']),
          name,
          color: row['color'] != null ? String(row['color']) : null,
          documentCount: Number(row['document_count'] ?? 0),
          highlightSpans: highlightFuzzyMatches(name, queryTokens),
          score: Number(row['score'] ?? 0),
        };
      }),
    };
  }

  /** JSONB embeddings + in-process cosine (ADR 016). Bounded to lexical candidates unless full scan. */
  async rankDocumentsByEmbedding(
    userId: string,
    queryVector: number[],
    limit: number,
    candidateDocumentIds: string[] | null
  ): Promise<RankedItem[]> {
    const vectors = await this.embeddingCache.loadForDocuments(
      this.pool,
      userId,
      candidateDocumentIds
    );
    const scored = [...vectors.entries()]
      .map(([id, vector]) => ({
        id,
        score: cosineSimilarity(queryVector, vector),
      }))
      .filter((r) => r.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored.map((r, i) => ({ id: r.id, rank: i + 1 }));
  }
}
