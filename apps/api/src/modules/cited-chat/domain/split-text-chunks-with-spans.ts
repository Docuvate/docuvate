// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';

import { normalizeExtractionSurfaceText } from './normalize-extraction-surface-text.js';

export const CHUNK_SIZE = 320;
export const CHUNK_OVERLAP = 64;

export interface TextChunkSpan {
  body: string;
  charStart: number;
  charEnd: number;
  page: number | null;
}

export function normalizeDocumentText(text: string): string {
  return normalizeExtractionSurfaceText(text).replace(/\s+/g, ' ').trim();
}

export function splitTextChunksWithSpans(text: string): TextChunkSpan[] {
  const normalized = normalizeDocumentText(text);
  if (!normalized) {
    return [];
  }
  const chunks: TextChunkSpan[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + CHUNK_SIZE);
    const slice = normalized.slice(start, end).trim();
    if (slice) {
      const charStart = normalized.indexOf(slice, start);
      const charEnd = charStart + slice.length;
      chunks.push({ body: slice, charStart, charEnd, page: null });
    }
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}

function pageForChunkFromBlocks(chunkBody: string, blocks: ExtractionBlock[]): number {
  const chunkNorm = chunkBody.toLowerCase();
  const probe = chunkNorm.slice(0, Math.min(64, chunkNorm.length)).trim();
  if (!probe) {
    return blocks[0]?.page ?? 1;
  }
  let bestPage: number | null = null;
  let bestScore = 0;
  for (const block of blocks) {
    const piece = normalizeDocumentText(block.text);
    if (piece.length < 3) {
      continue;
    }
    const pieceNorm = piece.toLowerCase();
    const key = pieceNorm.slice(0, Math.min(48, pieceNorm.length));
    let score = 0;
    if (chunkNorm.includes(key)) {
      score = key.length;
    } else if (key.includes(probe.slice(0, Math.min(32, probe.length)))) {
      score = probe.length;
    } else {
      const words = probe.split(/\s+/).filter((w) => w.length >= 4);
      for (const word of words) {
        if (pieceNorm.includes(word)) {
          score += word.length;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPage = block.page;
    }
  }
  if (bestScore === 0) {
    return null;
  }
  return bestPage;
}

/** Map chunks to pages using extraction blocks (overlap match; offsets alone often drift from full text). */
export function attachPagesToChunks(
  chunks: TextChunkSpan[],
  blocks: ExtractionBlock[] | undefined
): TextChunkSpan[] {
  if (!blocks?.length) {
    return chunks;
  }
  const ordered = [...blocks].sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    return (a.blockIndex ?? 0) - (b.blockIndex ?? 0);
  });
  return chunks.map((chunk) => ({
    ...chunk,
    page: pageForChunkFromBlocks(chunk.body, ordered),
  }));
}

export function chunkIndexText(title: string, body: string): string {
  const prefix = title.trim();
  if (!prefix) {
    return body;
  }
  return `${prefix}: ${body}`;
}
