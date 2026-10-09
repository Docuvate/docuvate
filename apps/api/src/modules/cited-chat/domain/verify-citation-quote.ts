// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  extractNumericTokens,
  fuzzyWordsMatch,
  numericTokensPresentInText,
} from './quote-numeric-consistency.js';
import { chunkIndexText } from './split-text-chunks-with-spans.js';

const QUOTE_WORD_LIMIT = 10;

export function normalizeForQuoteMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[„“"''`´]/g, '')
    .replace(/[:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse German/English number formatting so 1.234,56 and 1234.56 align for matching. */
export function normalizeNumbersForQuoteMatch(text: string): string {
  let out = normalizeForQuoteMatch(text);
  out = out.replace(
    /\b(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\b/g,
    (_match, intPart: string, frac?: string) => {
      const digits = String(intPart).replace(/\./g, '');
      return frac != null && frac !== '' ? `${digits}.${frac}` : digits;
    }
  );
  out = out.replace(/\b(\d+)\.(\d{1,2})\b/g, '$1.$2');
  return out.replace(/\s+/g, ' ').trim();
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

function isInvisibleQuoteChar(codePoint: number): boolean {
  return (
    codePoint === 0x00ad ||
    codePoint === 0x200b ||
    codePoint === 0x200c ||
    codePoint === 0x200d ||
    codePoint === 0xfeff
  );
}

function appendExpandedChar(map: NormalizedBodyMap, bodyIndex: number, ch: string): void {
  if (/[„“"''`´]/.test(ch)) {
    return;
  }
  if (/[:;]/.test(ch)) {
    if (map.normalized.length > 0 && map.normalized[map.normalized.length - 1] !== ' ') {
      appendNormalizedChar(map, bodyIndex, ' ');
    }
    return;
  }
  if (/\s/.test(ch)) {
    if (map.normalized.length > 0 && map.normalized[map.normalized.length - 1] !== ' ') {
      appendNormalizedChar(map, bodyIndex, ' ');
    }
    return;
  }
  const lower = ch.toLocaleLowerCase('de');
  for (const normCh of lower) {
    appendNormalizedChar(map, bodyIndex, normCh);
  }
}

/** Build lowercase normalized text while tracking original body indices (per code unit). */
export function buildNormalizedBodyMap(chunkBody: string): NormalizedBodyMap {
  const map: NormalizedBodyMap = { normalized: '', bodyIndexAt: [] };
  let i = 0;
  while (i < chunkBody.length) {
    const cp = chunkBody.codePointAt(i);
    if (cp === undefined) {
      break;
    }
    const charLen = cp > 0xffff ? 2 : 1;
    const bodyIndex = i;

    if (isInvisibleQuoteChar(cp)) {
      i += charLen;
      continue;
    }

    const asString = String.fromCodePoint(cp);
    if (/\s/.test(asString)) {
      if (map.normalized.length > 0 && map.normalized[map.normalized.length - 1] !== ' ') {
        appendNormalizedChar(map, bodyIndex, ' ');
      }
      i += charLen;
      while (i < chunkBody.length) {
        const ws = chunkBody.codePointAt(i);
        if (ws === undefined || !/\s/.test(String.fromCodePoint(ws))) {
          break;
        }
        i += ws > 0xffff ? 2 : 1;
      }
      continue;
    }

    const nfkcExpanded = asString.normalize('NFKC');
    for (const ch of nfkcExpanded) {
      appendExpandedChar(map, bodyIndex, ch);
    }
    i += charLen;
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

function sliceFromBodyMap(
  chunkBody: string,
  bodyMap: NormalizedBodyMap,
  idx: number,
  needleLen: number
): { charStart: number; charEnd: number; bodyQuote: string } | null {
  const startBodyIndex = bodyMap.bodyIndexAt[idx];
  const lastNormIndex = idx + needleLen - 1;
  const endBodyIndex = bodyMap.bodyIndexAt[lastNormIndex];
  if (startBodyIndex === undefined || endBodyIndex === undefined) {
    return null;
  }
  const charEnd = endBodyIndex + 1;
  const bodyQuote = chunkBody.slice(startBodyIndex, charEnd);
  return { charStart: startBodyIndex, charEnd, bodyQuote };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function digitSequencePattern(digits: string): string {
  if (digits.length < 3) {
    return '';
  }
  const sep = '[.,\\s]?';
  return `(?<![\\d])${digits.split('').join(sep)}(?!\\d)`;
}

function findQuoteRegexInChunk(
  chunkBody: string,
  quote: string
): { charStart: number; charEnd: number; bodyQuote: string } | null {
  const words = normalizeForQuoteMatch(truncateQuoteWords(quote)).split(' ').filter(Boolean);
  if (words.length === 0) {
    return null;
  }
  const parts = words.map((word) => {
    const digits = word.replace(/[^\d]/g, '');
    if (digits.length >= 3) {
      const flex = digitSequencePattern(digits);
      if (!flex) {
        return escapeRegExp(word);
      }
      if (word === digits) {
        return flex;
      }
      return `(?:${escapeRegExp(word)}|${flex})`;
    }
    return escapeRegExp(word);
  });
  const pattern = parts.join('[\\s\\n\\r:;]+');
  const re = new RegExp(pattern, 'iu');
  const match = chunkBody.match(re);
  if (!match || match.index === undefined) {
    return null;
  }
  const bodyQuote = match[0];
  return { charStart: match.index, charEnd: match.index + bodyQuote.length, bodyQuote };
}

export type QuoteSpanMatch = {
  charStart: number;
  charEnd: number;
  bodyQuote: string;
  method: 'literal' | 'numeric' | 'regex' | 'fuzzy';
  score: number;
};

function asQuoteSpanMatch(
  hit: { charStart: number; charEnd: number; bodyQuote: string },
  method: QuoteSpanMatch['method'],
  score: number
): QuoteSpanMatch {
  return { ...hit, method, score };
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
  const literalNeedle = normalizeForQuoteMatch(trimmed);
  const literalIdx = bodyMap.normalized.indexOf(literalNeedle);
  if (literalIdx >= 0) {
    return sliceFromBodyMap(chunkBody, bodyMap, literalIdx, literalNeedle.length);
  }

  const numericNeedle = normalizeNumbersForQuoteMatch(trimmed);
  const numericBody = normalizeNumbersForQuoteMatch(bodyMap.normalized);
  if (numericNeedle.length > 0 && numericBody.length === bodyMap.normalized.length) {
    const numericIdx = numericBody.indexOf(numericNeedle);
    if (numericIdx >= 0) {
      return sliceFromBodyMap(chunkBody, bodyMap, numericIdx, numericNeedle.length);
    }
  }

  const regexHit = findQuoteRegexInChunk(chunkBody, trimmed);
  if (regexHit) {
    return regexHit;
  }
  return null;
}

function significantWords(text: string): string[] {
  return normalizeForQuoteMatch(truncateQuoteWords(text))
    .split(' ')
    .filter((w) => w.length >= 1);
}

function tokenizeBodyWords(
  bodyMap: NormalizedBodyMap
): Array<{ raw: string; normStart: number; normEnd: number }> {
  const bodyWords: Array<{ raw: string; normStart: number; normEnd: number }> = [];
  let i = 0;
  while (i < bodyMap.normalized.length) {
    while (i < bodyMap.normalized.length && bodyMap.normalized[i] === ' ') {
      i += 1;
    }
    if (i >= bodyMap.normalized.length) {
      break;
    }
    const start = i;
    while (i < bodyMap.normalized.length && bodyMap.normalized[i] !== ' ') {
      i += 1;
    }
    bodyWords.push({
      raw: bodyMap.normalized.slice(start, i),
      normStart: start,
      normEnd: i,
    });
  }
  return bodyWords;
}

function sliceBodyWordsToQuote(
  chunkBody: string,
  bodyMap: NormalizedBodyMap,
  bodyWords: Array<{ raw: string; normStart: number; normEnd: number }>,
  firstIdx: number,
  lastIdx: number
): QuoteSpanMatch | null {
  const normStart = bodyWords[firstIdx].normStart;
  const normEnd = bodyWords[lastIdx].normEnd;
  const startBodyIndex = bodyMap.bodyIndexAt[normStart];
  const endBodyIndex = bodyMap.bodyIndexAt[normEnd - 1];
  if (startBodyIndex === undefined || endBodyIndex === undefined) {
    return null;
  }
  const charEnd = endBodyIndex + 1;
  const bodyQuote = chunkBody.slice(startBodyIndex, charEnd);
  return {
    charStart: startBodyIndex,
    charEnd,
    bodyQuote,
    method: 'fuzzy',
    score: 1,
  };
}

/**
 * Ordered, contiguous fuzzy match: non-numeric words may differ by <=1 edit; numeric tokens must match exactly.
 */
export function fuzzySpanSearchInChunk(
  chunkBody: string,
  needleText: string
): QuoteSpanMatch | null {
  const needleWords = significantWords(needleText);
  if (needleWords.length === 0) {
    return null;
  }
  const bodyMap = buildNormalizedBodyMap(chunkBody);
  const bodyWords = tokenizeBodyWords(bodyMap);
  if (bodyWords.length === 0) {
    return null;
  }

  for (let start = 0; start < bodyWords.length; start += 1) {
    let bwIdx = start;
    const matchedIndices: number[] = [];
    let allMatched = true;
    for (const nw of needleWords) {
      while (bwIdx < bodyWords.length && !fuzzyWordsMatch(nw, bodyWords[bwIdx].raw)) {
        bwIdx += 1;
      }
      if (bwIdx >= bodyWords.length) {
        allMatched = false;
        break;
      }
      matchedIndices.push(bwIdx);
      bwIdx += 1;
    }
    if (!allMatched || matchedIndices.length !== needleWords.length) {
      continue;
    }
    const contiguous = matchedIndices.every(
      (idx, i) => i === 0 || idx === matchedIndices[i - 1] + 1
    );
    if (!contiguous) {
      continue;
    }
    const hit = sliceBodyWordsToQuote(
      chunkBody,
      bodyMap,
      bodyWords,
      matchedIndices[0],
      matchedIndices[matchedIndices.length - 1]
    );
    if (!hit) {
      continue;
    }
    const quoteNums = extractNumericTokens(needleText);
    if (!numericTokensPresentInText(quoteNums, hit.bodyQuote)) {
      continue;
    }
    return hit;
  }
  return null;
}

function textForNumericQuoteCheck(text: string): string {
  return text.replace(/\u00ad/g, '').replace(/[\u200b-\u200d\ufeff]/g, '');
}

export function validateMatchedSpanNumbers(input: {
  quote: string;
  claimText: string;
  bodyQuote: string;
  chunkBody: string;
}): boolean {
  const bodyQuoteNums = textForNumericQuoteCheck(input.bodyQuote);
  const chunkBodyNums = textForNumericQuoteCheck(input.chunkBody);
  const quoteNums = extractNumericTokens(input.quote);
  if (!numericTokensPresentInText(quoteNums, bodyQuoteNums)) {
    return false;
  }
  const claimNums = extractNumericTokens(input.claimText);
  return (
    numericTokensPresentInText(claimNums, bodyQuoteNums) ||
    numericTokensPresentInText(claimNums, chunkBodyNums)
  );
}

export function bestQuoteMatchScore(chunkBody: string, quote: string): number {
  const trimmed = truncateQuoteWords(quote);
  if (!trimmed) {
    return 0;
  }
  const direct = findQuoteInChunk(chunkBody, trimmed);
  if (direct) {
    return 1;
  }
  const fuzzy = fuzzySpanSearchInChunk(chunkBody, trimmed);
  return fuzzy?.score ?? 0;
}

function acceptResolvedMatch(
  chunkBody: string,
  quote: string,
  claimText: string,
  match: { charStart: number; charEnd: number; bodyQuote: string },
  method: QuoteSpanMatch['method'],
  score: number
): QuoteSpanMatch | null {
  if (
    !validateMatchedSpanNumbers({
      quote,
      claimText,
      bodyQuote: match.bodyQuote,
      chunkBody,
    })
  ) {
    return null;
  }
  return asQuoteSpanMatch(match, method, score);
}

function mapPassageMatchToBody(
  title: string,
  body: string,
  passageMatch: QuoteSpanMatch
): QuoteSpanMatch | null {
  const prefix = title.trim() ? `${title.trim()}: ` : '';
  if (passageMatch.charStart < prefix.length) {
    return null;
  }
  const bodyStart = passageMatch.charStart - prefix.length;
  const bodyEnd = passageMatch.charEnd - prefix.length;
  if (bodyStart < 0 || bodyEnd > body.length) {
    return null;
  }
  const bodyQuote = body.slice(bodyStart, bodyEnd);
  return {
    charStart: bodyStart,
    charEnd: bodyEnd,
    bodyQuote,
    method: passageMatch.method,
    score: passageMatch.score,
  };
}

export function resolveQuoteInCandidateChunk(
  candidate: { documentTitle: string; body: string },
  quote: string,
  options?: { claimText?: string }
): QuoteSpanMatch | null {
  const direct = resolveQuoteInChunk(candidate.body, quote, options);
  if (direct) {
    return direct;
  }
  const passage = chunkIndexText(candidate.documentTitle, candidate.body);
  if (passage === candidate.body) {
    return null;
  }
  const passageHit = resolveQuoteInChunk(passage, quote, { claimText: '' });
  if (!passageHit) {
    return null;
  }
  return mapPassageMatchToBody(candidate.documentTitle, candidate.body, passageHit);
}

export function resolveQuoteInChunk(
  chunkBody: string,
  quote: string,
  options?: { claimText?: string }
): QuoteSpanMatch | null {
  const claimText = options?.claimText?.trim() ?? '';
  const trimmed = truncateQuoteWords(quote);
  if (trimmed) {
    const direct = findQuoteInChunk(chunkBody, trimmed);
    if (direct) {
      return acceptResolvedMatch(chunkBody, trimmed, claimText, direct, 'literal', 1);
    }
    const fuzzy = fuzzySpanSearchInChunk(chunkBody, trimmed);
    if (fuzzy) {
      return acceptResolvedMatch(
        chunkBody,
        trimmed,
        claimText,
        fuzzy,
        fuzzy.method,
        fuzzy.score
      );
    }
  }

  return null;
}

export function passesRerankerGate(bestScore: number, threshold: number): boolean {
  return bestScore >= threshold;
}

export function passesFusionGate(bestFusionScore: number, threshold: number): boolean {
  return bestFusionScore >= threshold;
}
