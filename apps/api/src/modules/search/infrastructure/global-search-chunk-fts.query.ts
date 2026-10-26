// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../domain/normalize-search-text.js';

/** Max original query tokens that may hit chunk FTS (expansions never hit chunks). */
export const CHUNK_FTS_TERM_LIMIT = 4;
/** Minimum token length for chunk FTS (reduces overly broad plainto_tsquery matches). */
export const CHUNK_FTS_MIN_TERM_LENGTH = 4;

/**
 * SQL for chunk body search: one GIN (search_vector) index probe per original query term via LATERAL.
 * Parameters: $1 user_id, $2 text[] terms (original query tokens only).
 */
export const CHUNK_FTS_LATERAL_SQL = `
SELECT hits.document_id, hits.body, hits.score
FROM unnest($2::text[]) AS q(term)
CROSS JOIN LATERAL (
  SELECT c.document_id, c.body,
         ts_rank_cd(c.search_vector, plainto_tsquery('simple', q.term)) AS score
  FROM document_text_chunks c
  INNER JOIN documents d ON d.id = c.document_id AND d.user_id = $1
  WHERE length(q.term) >= ${String(CHUNK_FTS_MIN_TERM_LENGTH)}
    AND c.search_vector @@ plainto_tsquery('simple', q.term)
  ORDER BY score DESC
  LIMIT 8
) hits
WHERE hits.document_id IS NOT NULL
ORDER BY hits.score DESC NULLS LAST
LIMIT 32`;

export function buildChunkFtsSearchTerms(queryTokens: string[]): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();
  for (const token of queryTokens) {
    const normalized = normalizeSearchText(token);
    if (normalized.length < CHUNK_FTS_MIN_TERM_LENGTH) {
      continue;
    }
    if (normalized.length > 64) {
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    terms.push(normalized);
    if (terms.length >= CHUNK_FTS_TERM_LIMIT) {
      break;
    }
  }
  return terms;
}

export function buildLexicalTrgmProbes(queryTokens: string[], expandedTerms: string[]): string[] {
  const probes = new Set<string>();
  for (const token of queryTokens) {
    const normalized = normalizeSearchText(token);
    if (normalized.length >= 3) {
      probes.add(normalized);
    }
  }
  for (const term of expandedTerms) {
    const normalized = normalizeSearchText(term);
    if (normalized.length >= 3) {
      probes.add(normalized);
    }
  }
  return [...probes].slice(0, 8);
}
