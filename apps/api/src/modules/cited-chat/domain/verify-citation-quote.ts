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

interface NormalizedBodyMap {
  normalized: string;
  /** For each index in `normalized`, the index in the original chunk body. */
  bodyIndexAt: number[];
}

function appendNormalizedChar(map: NormalizedBodyMap, bodyIndex: number, ch: string): void {
  map.normalized += ch;
  map.bodyIndexAt.push(bodyIndex);
}

/** Build lowercase normalized text while tracking original body indices (per code unit). */
export function buildNormalizedBodyMap(chunkBody: string): NormalizedBodyMap {
  const map: NormalizedBodyMap = { normalized: '', bodyIndexAt: [] };
  let i = 0;
  while (i < chunkBody.length) {
    const ch = chunkBody[i];
    if (/[„“"''`´]/.test(ch)) {
      i += 1;
      continue;
    }
    if (/\s/.test(ch)) {
      if (map.normalized.length > 0 && map.normalized[map.normalized.length - 1] !== ' ') {
        appendNormalizedChar(map, i, ' ');
      }
      while (i < chunkBody.length && /\s/.test(chunkBody[i])) {
        i += 1;
      }
      continue;
    }
    const lower = ch.toLocaleLowerCase('de');
    for (const normCh of lower) {
      appendNormalizedChar(map, i, normCh);
    }
    i += 1;
  }
  let start = 0;
  let end = map.normalized.length;
  while (start < end && map.normalized[start] === ' ') {
    start += 1;
  }
  while (end > start && map.normalized[end - 1] === ' ') {
    end -= 1;
  }
  return {
    normalized: map.normalized.slice(start, end),
    bodyIndexAt: map.bodyIndexAt.slice(start, end),
  };
}

export function findQuoteInChunk(
  chunkBody: string,
  quote: string
): { charStart: number; charEnd: number; bodyQuote: string } | null {
  const trimmed = truncateQuoteWords(quote);
  if (!trimmed) {
    return null;
  }
  const bodyMap = buildNormalizedBodyMap(chunkBody);
  const needle = normalizeForQuoteMatch(trimmed);
  const idx = bodyMap.normalized.indexOf(needle);
  if (idx < 0 || needle.length === 0) {
    return null;
  }
  const startBodyIndex = bodyMap.bodyIndexAt[idx];
  const lastNormIndex = idx + needle.length - 1;
  const endBodyIndex = bodyMap.bodyIndexAt[lastNormIndex];
  if (startBodyIndex === undefined || endBodyIndex === undefined) {
    return null;
  }
  const charEnd = endBodyIndex + 1;
  const bodyQuote = chunkBody.slice(startBodyIndex, charEnd);
  return { charStart: startBodyIndex, charEnd, bodyQuote };
}

export function passesRerankerGate(bestScore: number, threshold: number): boolean {
  return bestScore >= threshold;
}

export function passesFusionGate(bestFusionScore: number, threshold: number): boolean {
  return bestFusionScore >= threshold;
}
