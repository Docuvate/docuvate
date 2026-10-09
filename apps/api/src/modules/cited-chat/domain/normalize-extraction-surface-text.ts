// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Strip invisible / hyphenation artifacts for **new** chunk indexing (splitTextChunksWithSpans).
 * Quote verification matches the stored chunk body as-is via buildNormalizedBodyMap (no reindex required).
 */
export function normalizeExtractionSurfaceText(text: string): string {
  let out = text.normalize('NFKC');
  out = out.replace(/\u00ad/g, '');
  out = out.replace(/[\u200b-\u200d\ufeff]/g, '');
  out = out.replace(/\r\n?/g, '\n');
  return out;
}
