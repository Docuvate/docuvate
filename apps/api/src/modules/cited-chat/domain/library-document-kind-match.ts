// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';

export interface LibraryDocumentKindHint {
  /** Normalized tokens that should appear in title, filename, or body. */
  tokens: string[];
}

const KIND_HINTS: Readonly<Record<string, LibraryDocumentKindHint>> = {
  entgeltnachweis: { tokens: ['entgeltnachweis'] },
  lohnsteuerbescheinigung: { tokens: ['lohnsteuerbescheinigung', 'lohnsteuer'] },
};

/** Document-kind cues from German library questions (no filename regexes). */
export function extractLibraryDocumentKindHints(query: string): LibraryDocumentKindHint[] {
  const normalized = normalizeSearchText(query);
  const hints: LibraryDocumentKindHint[] = [];
  for (const [needle, hint] of Object.entries(KIND_HINTS)) {
    if (normalized.includes(needle)) {
      hints.push(hint);
    }
  }
  return hints;
}

export function libraryDocumentKindMatchBoost(input: {
  query: string;
  filename: string;
  title: string;
  body: string;
}): number {
  const hints = extractLibraryDocumentKindHints(input.query);
  if (hints.length === 0) {
    return 0;
  }
  const corpus = normalizeSearchText(
    [input.filename, input.title, input.body].join('\n')
  );
  let best = 0;
  for (const hint of hints) {
    const matched = hint.tokens.some((token) => corpus.includes(token));
    if (matched) {
      best = Math.max(best, 0.25);
    }
  }
  return best;
}

export function documentMatchesLibraryKindHints(input: {
  filename: string;
  title: string;
  body: string;
  hints: LibraryDocumentKindHint[];
}): boolean {
  if (input.hints.length === 0) {
    return true;
  }
  const corpus = normalizeSearchText(
    [input.filename, input.title, input.body].join('\n')
  );
  return input.hints.every((hint) => hint.tokens.some((token) => corpus.includes(token)));
}
