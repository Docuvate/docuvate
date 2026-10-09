import type { ExtractionBlock } from '@docuvate/contracts';

export const CHUNK_SIZE = 320;
export const CHUNK_OVERLAP = 64;

export interface TextChunkSpan {
  body: string;
  charStart: number;
  charEnd: number;
  page: number | null;
}

export function normalizeDocumentText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
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

/** Map normalized char offsets to a page using extraction blocks (best effort). */
export function attachPagesToChunks(
  chunks: TextChunkSpan[],
  blocks: ExtractionBlock[] | undefined
): TextChunkSpan[] {
  if (!blocks?.length) {
    return chunks.map((c) => ({ ...c, page: c.page ?? 1 }));
  }
  const ordered = [...blocks].sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page;
    }
    return (a.blockIndex ?? 0) - (b.blockIndex ?? 0);
  });
  let cursor = 0;
  const blockRanges: Array<{ page: number; start: number; end: number }> = [];
  for (const block of ordered) {
    const piece = normalizeDocumentText(block.text ?? '');
    if (!piece) {
      continue;
    }
    const start = cursor;
    const end = start + piece.length;
    blockRanges.push({ page: block.page, start, end });
    cursor = end + 1;
  }
  return chunks.map((chunk) => {
    const mid = chunk.charStart + Math.floor((chunk.charEnd - chunk.charStart) / 2);
    const hit = blockRanges.find((r) => mid >= r.start && mid < r.end);
    return { ...chunk, page: hit?.page ?? blockRanges[0]?.page ?? 1 };
  });
}

export function chunkIndexText(title: string, body: string): string {
  const prefix = title.trim();
  if (!prefix) {
    return body;
  }
  return `${prefix}: ${body}`;
}
