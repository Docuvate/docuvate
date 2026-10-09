import { normalizeForQuoteMatch, normalizeNumbersForQuoteMatch } from './verify-citation-quote.js';

export function wordContainsDigit(word: string): boolean {
  return /\d/.test(word);
}

export function normalizeMatchWord(word: string): string {
  if (wordContainsDigit(word)) {
    return normalizeNumbersForQuoteMatch(word);
  }
  return normalizeForQuoteMatch(word);
}

/** Normalized numeric tokens (amounts, dates, IBAN fragments) from text. */
export function extractNumericTokens(text: string): string[] {
  const words = normalizeForQuoteMatch(text).split(' ').filter(Boolean);
  const tokens: string[] = [];
  for (const word of words) {
    if (!wordContainsDigit(word)) {
      continue;
    }
    tokens.push(normalizeNumbersForQuoteMatch(word));
  }
  return tokens;
}

export function numericTokensPresentInText(required: string[], text: string): boolean {
  if (required.length === 0) {
    return true;
  }
  const pool = extractNumericTokens(text);
  return required.every((token) => pool.includes(token));
}

export function levenshteinAtMostOne(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }
  if (a.length < 5 || b.length < 5) {
    return false;
  }
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) {
      return false;
    }
    if (a.length > b.length) {
      i += 1;
    } else if (b.length > a.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  edits += a.length - i + (b.length - j);
  return edits <= 1;
}

export function fuzzyWordsMatch(needleWord: string, bodyWord: string): boolean {
  const n = normalizeMatchWord(needleWord);
  const b = normalizeMatchWord(bodyWord);
  if (wordContainsDigit(needleWord) || wordContainsDigit(bodyWord)) {
    return n === b;
  }
  if (n === b) {
    return true;
  }
  return levenshteinAtMostOne(n, b);
}
