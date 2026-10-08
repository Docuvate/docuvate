const CHUNK_SIZE = 480;
const CHUNK_OVERLAP = 96;

/** Mirrors worker context_qa chunking for consistent semantic snippets. */
export function splitTextChunks(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + CHUNK_SIZE);
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}
