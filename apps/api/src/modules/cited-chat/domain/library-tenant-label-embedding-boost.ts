// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';
import { cosineSimilarity } from './embedding-cosine.js';

const LABEL_QUERY_MIN_SIM = 0.8;
const LABEL_ON_DOC_BOOST = 0.48;
const LABEL_IN_CORPUS_BOOST = 0.18;
const LABEL_ASSIGNED_MISMATCH_PENALTY = 0.38;

export interface TenantLabelEmbeddingRow {
  name: string;
  vector: number[];
}

function rankedLabelAlignments(
  queryVector: number[],
  labelRows: readonly TenantLabelEmbeddingRow[]
): { row: TenantLabelEmbeddingRow; score: number }[] {
  if (queryVector.length === 0 || labelRows.length === 0) {
    return [];
  }
  return labelRows
    .map((row) => ({ row, score: cosineSimilarity(queryVector, row.vector) }))
    .sort((a, b) => b.score - a.score);
}

/** Labels whose name embedding aligns with the question (no substring keyword lists). */
export function tenantLabelsAlignedWithQuery(
  queryVector: number[],
  labelRows: readonly TenantLabelEmbeddingRow[]
): TenantLabelEmbeddingRow[] {
  return rankedLabelAlignments(queryVector, labelRows)
    .filter((entry) => entry.score >= LABEL_QUERY_MIN_SIM)
    .map((entry) => entry.row);
}

/** Best-matching tenant label for scoped library retrieval (embedding margin, no keyword lists). */
export function tenantLabelsForLibraryRetrievalSupplement(
  queryVector: number[],
  labelRows: readonly TenantLabelEmbeddingRow[]
): TenantLabelEmbeddingRow[] {
  const RETRIEVAL_SUPPLEMENT_MIN_SIM = 0.72;
  const ranked = rankedLabelAlignments(queryVector, labelRows);
  if (ranked.length === 0 || ranked[0].score < RETRIEVAL_SUPPLEMENT_MIN_SIM) {
    return [];
  }
  return [ranked[0].row];
}

export function libraryTenantLabelEmbeddingBoost(input: {
  alignedLabels: readonly TenantLabelEmbeddingRow[];
  filename: string;
  title: string;
  body: string;
  documentLabelNames: readonly string[];
}): number {
  if (input.alignedLabels.length === 0) {
    return 0;
  }
  const docLabelSet = new Set(input.documentLabelNames.map((name) => normalizeSearchText(name)));
  for (const label of input.alignedLabels) {
    if (docLabelSet.has(normalizeSearchText(label.name))) {
      return LABEL_ON_DOC_BOOST;
    }
  }
  const corpus = normalizeSearchText([input.filename, input.title, input.body].join('\n'));
  for (const label of input.alignedLabels) {
    if (corpus.includes(normalizeSearchText(label.name))) {
      return LABEL_IN_CORPUS_BOOST;
    }
  }
  return 0;
}

/** Down-rank documents whose assigned labels miss query-aligned labels but carry other non-inbox labels. */
export function libraryTenantLabelAssignedMismatchPenalty(input: {
  alignedLabels: readonly TenantLabelEmbeddingRow[];
  documentLabelNames: readonly string[];
}): number {
  if (input.alignedLabels.length === 0 || input.documentLabelNames.length === 0) {
    return 0;
  }
  const aligned = new Set(input.alignedLabels.map((row) => normalizeSearchText(row.name)));
  const docLabels = input.documentLabelNames.map((name) => normalizeSearchText(name));
  const hasAligned = docLabels.some((name) => aligned.has(name));
  if (hasAligned) {
    return 0;
  }
  return -LABEL_ASSIGNED_MISMATCH_PENALTY;
}
