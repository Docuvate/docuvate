// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Strict trigram vocabulary lookup (precomputed search_vocabulary_terms only). */
export const VOCABULARY_STRICT_TRGM_SQL = `
SELECT v.term,
       GREATEST(
         similarity(v.term, $2::text),
         word_similarity($2::text, v.term)
       ) AS sim
FROM search_vocabulary_terms v
WHERE v.user_id = $1
  AND length(v.term) >= 3
  AND length(v.term) <= 48
  AND ($2::text <<% v.term OR v.term <<% $2::text)
ORDER BY sim DESC
LIMIT $3`;

/** Fallback typo lookup when strict <<% returns no rows (still index-friendly <%). */
export const VOCABULARY_RELAXED_TRGM_SQL = `
SELECT v.term,
       GREATEST(
         similarity(v.term, $2::text),
         word_similarity($2::text, v.term)
       ) AS sim
FROM search_vocabulary_terms v
WHERE v.user_id = $1
  AND length(v.term) >= 3
  AND length(v.term) <= 48
  AND ($2::text <% v.term OR v.term <% $2::text)
ORDER BY sim DESC
LIMIT $3`;

/** Last-resort typo neighbors (GIN similarity on term; used when <% / <<% return nothing). */
export const VOCABULARY_SIMILARITY_FALLBACK_SQL = `
SELECT v.term,
       similarity(v.term, $2::text) AS sim
FROM search_vocabulary_terms v
WHERE v.user_id = $1
  AND length(v.term) >= 3
  AND length(v.term) <= 48
  AND similarity(v.term, $2::text) > 0.25
ORDER BY sim DESC
LIMIT $3`;
