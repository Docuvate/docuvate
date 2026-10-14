// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';
import { cosineSimilarity } from './embedding-cosine.js';

const LABEL_QUERY_MIN_SIM = 0.82;
const LABEL_ON_DOC_BOOST = 0.25;
const LABEL_IN_CORPUS_BOOST = 0.15;

export interface TenantLabelEmbeddingRow {
  name: string;
  vector: number[];
}

/** Labels whose name embedding aligns with the question (no substring keyword lists). */
export function tenantLabelsAlignedWithQuery(
  queryVector: number[],
  labelRows: readonly TenantLabelEmbeddingRow[]
): TenantLabelEmbeddingRow[] {
  if (queryVector.length === 0 || labelRows.length === 0) {
    return [];
  }
  return labelRows
    .map((row) => ({ row, score: cosineSimilarity(queryVector, row.vector) }))
    .filter((entry) => entry.score >= LABEL_QUERY_MIN_SIM)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.row);
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
