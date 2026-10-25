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
    let sliceStart = start;
    while (sliceStart < end && normalized[sliceStart] === ' ') {
      sliceStart += 1;
    }
    let sliceEnd = end;
    while (sliceEnd > sliceStart && normalized[sliceEnd - 1] === ' ') {
      sliceEnd -= 1;
    }
    if (sliceEnd > sliceStart) {
      chunks.push({
        body: normalized.slice(sliceStart, sliceEnd),
        charStart: sliceStart,
        charEnd: sliceEnd,
        page: null,
      });
    }
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}

interface BlockWordIndex {
  wordToPage: Map<string, number>;
  keyToPage: Map<string, number>;
  fallbackPage: number | null;
}

function buildBlockWordIndex(blocks: ExtractionBlock[]): BlockWordIndex {
  const wordToPage = new Map<string, number>();
  const keyToPage = new Map<string, number>();
  let fallbackPage: number | null = null;
  for (const block of blocks) {
    fallbackPage = block.page;
    const piece = normalizeDocumentText(block.text);
    if (piece.length < 3) {
      continue;
    }
    const pieceNorm = piece.toLowerCase();
    const key = pieceNorm.slice(0, Math.min(48, pieceNorm.length));
    if (key && !keyToPage.has(key)) {
      keyToPage.set(key, block.page);
    }
    for (const word of pieceNorm.split(/\s+/)) {
      if (word.length >= 4 && !wordToPage.has(word)) {
        wordToPage.set(word, block.page);
      }
    }
  }
  return { wordToPage, keyToPage, fallbackPage };
}

function pageForChunkFromIndex(chunkBody: string, index: BlockWordIndex): number | null {
  const chunkNorm = chunkBody.toLowerCase();
  const probe = chunkNorm.slice(0, Math.min(64, chunkNorm.length)).trim();
  if (!probe) {
    return index.fallbackPage;
  }
  let bestPage: number | null = null;
  let bestScore = 0;
  for (const word of probe.split(/\s+/)) {
    if (word.length < 4) {
      continue;
    }
    const page = index.wordToPage.get(word);
    if (page === undefined) {
      continue;
    }
    const score = word.length;
    if (score > bestScore) {
      bestScore = score;
      bestPage = page;
    }
  }
  if (bestScore === 0) {
    for (const [key, page] of index.keyToPage) {
      if (!chunkNorm.includes(key)) {
        continue;
      }
      const score = key.length;
      if (score > bestScore) {
        bestScore = score;
        bestPage = page;
      }
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
  const blockIndex = buildBlockWordIndex(ordered);
  return chunks.map((chunk) => ({
    ...chunk,
    page: pageForChunkFromIndex(chunk.body, blockIndex),
  }));
}

export function chunkIndexText(title: string, body: string): string {
  const prefix = title.trim();
  if (!prefix) {
    return body;
  }
  return `${prefix}: ${body}`;
}
