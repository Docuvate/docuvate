// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './embedding-cosine.js';

const METADATA_BOOST_FLOOR = 0.78;
const METADATA_BOOST_SCALE = 0.35;

/** Rerank boost from query–document metadata embedding similarity (language-agnostic). */
export function libraryMetadataEmbeddingBoost(
  queryVector: number[],
  metadataVector: number[] | undefined
): number {
  if (!metadataVector || metadataVector.length === 0 || queryVector.length === 0) {
    return 0;
  }
  const sim = cosineSimilarity(queryVector, metadataVector);
  if (sim <= METADATA_BOOST_FLOOR) {
    return 0;
  }
  return (sim - METADATA_BOOST_FLOOR) * METADATA_BOOST_SCALE;
}

export function buildLibraryMetadataEmbedText(input: {
  title: string;
  filename: string;
  documentDate: string | null;
  labelNames?: readonly string[];
}): string {
  const parts = [input.title.trim(), input.filename.trim()];
  if (input.documentDate) {
    parts.push(input.documentDate.trim());
  }
  if (input.labelNames && input.labelNames.length > 0) {
    parts.push(input.labelNames.join(' '));
  }
  return parts.filter((part) => part.length > 0).join('\n');
}
