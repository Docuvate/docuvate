// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Strict trigram vocabulary lookup (GIN: constant <<% indexed term). */
export const VOCABULARY_STRICT_TRGM_SQL = `
SELECT v.term,
       similarity(v.term, $2::text) AS sim
FROM search_vocabulary_terms v
WHERE v.user_id = $1
  AND length(v.term) >= 3
  AND length(v.term) <= 48
  AND $2::text <<% v.term
ORDER BY sim DESC
LIMIT $3`;

/** Fallback typo lookup when strict <<% returns no rows (GIN: indexed term <% constant). */
export const VOCABULARY_RELAXED_TRGM_SQL = `
SELECT v.term,
       similarity(v.term, $2::text) AS sim
FROM search_vocabulary_terms v
WHERE v.user_id = $1
  AND length(v.term) >= 3
  AND length(v.term) <= 48
  AND v.term <% $2::text
ORDER BY sim DESC
LIMIT $3`;

/** Last-resort typo neighbors (GIN: indexed term % constant with similarity_threshold). */
export const VOCABULARY_SIMILARITY_FALLBACK_SQL = `
SELECT v.term,
       similarity(v.term, $2::text) AS sim
FROM search_vocabulary_terms v
WHERE v.user_id = $1
  AND length(v.term) >= 3
  AND length(v.term) <= 48
  AND v.term % $2::text
ORDER BY sim DESC
LIMIT $3`;
