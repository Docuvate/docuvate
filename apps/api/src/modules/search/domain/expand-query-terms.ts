// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isTypoWithinDistance } from './damerau-levenshtein.js';
import { normalizeSearchText, tokenizeSearchQuery } from './normalize-search-text.js';

export interface VocabularyCandidate {
  term: string;
  similarity: number;
}

export const MIN_VOCABULARY_SIMILARITY = 0.45;
export const MIN_QUERY_RELEVANCE_SCORE = 0.45;
const MAX_EXPANSIONS_PER_TOKEN = 6;
const MIN_TOKEN_LENGTH_FOR_TYPO = 5;

export interface ExpandQueryTermsResult {
  expanded: string[];
  /** Highest confidence from accepted vocabulary neighbors (0 when none qualify). */
  queryRelevance: number;
}

/** Expand query tokens with vocabulary neighbors (trigram similarity supplied by caller). */
export async function expandQueryTerms(
  query: string,
  lookupSimilar: (token: string, limit: number) => Promise<VocabularyCandidate[]>
): Promise<ExpandQueryTermsResult> {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) {
    return { expanded: [], queryRelevance: 0 };
  }
  const expanded = new Set<string>(tokens);
  let queryRelevance = 0;

  for (const token of tokens) {
    expanded.add(normalizeSearchText(token));
    const neighbors = await lookupSimilar(token, MAX_EXPANSIONS_PER_TOKEN);
    const normToken = normalizeSearchText(token);
    for (const n of neighbors) {
      const normTerm = normalizeSearchText(n.term);
      const pgOk = n.similarity >= MIN_VOCABULARY_SIMILARITY;
      const dlOk =
        normToken.length >= MIN_TOKEN_LENGTH_FOR_TYPO &&
        normTerm.length >= MIN_TOKEN_LENGTH_FOR_TYPO &&
        isTypoWithinDistance(normToken, normTerm, 1);
      if (pgOk || dlOk) {
        expanded.add(n.term);
        if (pgOk) {
          queryRelevance = Math.max(queryRelevance, n.similarity);
        }
        if (dlOk) {
          queryRelevance = Math.max(queryRelevance, MIN_QUERY_RELEVANCE_SCORE);
        }
      }
    }
  }

  return {
    expanded: [...expanded].filter((t) => t.length >= 2),
    queryRelevance,
  };
}
