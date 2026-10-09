const QUOTE_WORD_LIMIT = 10;

export function normalizeForQuoteMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[„“"''`´]/g, '')
    .trim();
}

export function truncateQuoteWords(quote: string, maxWords = QUOTE_WORD_LIMIT): string {
  const words = quote.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ');
}

export function findQuoteInChunk(
  chunkBody: string,
  quote: string
): { charStart: number; charEnd: number } | null {
  const trimmed = truncateQuoteWords(quote);
  if (!trimmed) {
    return null;
  }
  const hay = normalizeForQuoteMatch(chunkBody);
  const needle = normalizeForQuoteMatch(trimmed);
  const idx = hay.indexOf(needle);
  if (idx < 0) {
    return null;
  }
  return { charStart: idx, charEnd: idx + needle.length };
}

export function passesRerankerGate(bestScore: number, threshold: number): boolean {
  return bestScore >= threshold;
}
