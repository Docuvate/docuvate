// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Fusion weight of each document search leg. */
export interface SearchLegWeights {
  /** Title equals the query (case-insensitive). */
  readonly exactTitle: number;
  /** Title contains the query as a phrase. */
  readonly titlePhrase: number;
  /** Full-text match on the document search vector. */
  readonly fullText: number;
  /** Trigram similarity on title and filename. */
  readonly titleTrigram: number;
  /** Full-text match on text chunks. */
  readonly chunkFullText: number;
  /** Match on extracted field values. */
  readonly fieldValue: number;
  /** Embedding similarity. */
  readonly embedding: number;
}

/**
 * The exact-title leg outweighs all other legs together, so a document whose title is the query
 * ranks first even when another document is the top hit of every other leg.
 */
export const SEARCH_LEG_WEIGHTS: SearchLegWeights = {
  exactTitle: 7,
  titlePhrase: 1,
  fullText: 1,
  titleTrigram: 1,
  chunkFullText: 1,
  fieldValue: 1,
  embedding: 1,
};
