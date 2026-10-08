import { isTypoWithinDistance } from './damerau-levenshtein.js';
import { normalizeSearchText, tokenizeSearchQuery } from './normalize-search-text.js';

export interface VocabularyCandidate {
  term: string;
  similarity: number;
}

const MIN_SIMILARITY = 0.28;
const MAX_EXPANSIONS_PER_TOKEN = 6;

/** Expand query tokens with vocabulary neighbors (trigram similarity supplied by caller). */
export async function expandQueryTerms(
  query: string,
  lookupSimilar: (token: string, limit: number) => Promise<VocabularyCandidate[]>
): Promise<{ expanded: string[] }> {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) {
    return { expanded: [] };
  }
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    expanded.add(normalizeSearchText(token));
    const neighbors = await lookupSimilar(token, MAX_EXPANSIONS_PER_TOKEN);
    const normToken = normalizeSearchText(token);
    for (const n of neighbors) {
      const normTerm = normalizeSearchText(n.term);
      const pgOk = n.similarity >= MIN_SIMILARITY;
      const dlOk =
        normToken.length >= 4 &&
        normTerm.length >= 4 &&
        isTypoWithinDistance(normToken, normTerm, normToken.length <= 8 ? 1 : 2);
      if (pgOk || dlOk) {
        expanded.add(n.term);
      }
    }
  }

  return { expanded: [...expanded].filter((t) => t.length >= 2) };
}
