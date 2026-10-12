// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { longestCommonSubsequenceLength } from './sequence-matcher.js';

export interface DuplicateCompareDocumentInput {
  documentId: string;
  filename: string;
  title: string;
  extractedTextSample: string;
  pageCount: number | null;
}

export interface DuplicatePairContext {
  left: DuplicateCompareDocumentInput;
  right: DuplicateCompareDocumentInput;
  embeddingSimilarity: number;
  perceptualPageHashDistance: number | null;
}

export interface ContentAlignmentStats {
  leftTokenCount: number;
  rightTokenCount: number;
  equalTokenCount: number;
  differingTokenCount: number;
  differingValueTokenCount: number;
  valueTokenCount: number;
  fractionDifferingTokens: number;
  fractionDifferingValueTokens: number;
  sampleDifferingValueTokens: string[];
}

export interface DuplicateFeatureVector {
  embeddingSimilarity: number;
  fractionDifferingTokens: number;
  fractionDifferingValueTokens: number;
  relativePageCountDiff: number;
  perceptualPageHashDistance: number;
  shingleJaccardDistance: number;
}

export function normalizeDocumentText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeDocumentText(text: string): string[] {
  const normalized = normalizeDocumentText(text);
  if (!normalized) return [];
  return normalized.split(/[^a-z0-9]+/i).filter((token) => token.length > 0);
}

export function isValueToken(token: string): boolean {
  return /\d/.test(token);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) row[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length];
}

const OCR_MAX_EDITS = 1;

function tokensEquivalent(left: string, right: string): boolean {
  if (left === right) return true;
  if (!isValueToken(left) || !isValueToken(right)) return false;
  return levenshteinDistance(left, right) <= OCR_MAX_EDITS;
}

function shingleSet(tokens: string[], size: number): Set<string> {
  const set = new Set<string>();
  if (tokens.length < size) {
    if (tokens.length > 0) set.add(tokens.join(' '));
    return set;
  }
  for (let i = 0; i <= tokens.length - size; i += 1) {
    set.add(tokens.slice(i, i + size).join(' '));
  }
  return set;
}

export function shingleJaccardDistance(tokensA: string[], tokensB: string[], size = 3): number {
  const a = shingleSet(tokensA, size);
  const b = shingleSet(tokensB, size);
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return 1 - intersection / union;
}

export function compareDocumentTexts(textA: string, textB: string): ContentAlignmentStats {
  const tokensA = tokenizeDocumentText(textA);
  const tokensB = tokenizeDocumentText(textB);
  const lcsLen = longestCommonSubsequenceLength(tokensA, tokensB, tokensEquivalent);
  const equalTokenCount = lcsLen;
  const differingTokenCount = tokensA.length + tokensB.length - 2 * lcsLen;

  const valueTokensA = tokensA.filter(isValueToken);
  const valueTokensB = tokensB.filter(isValueToken);
  const valueLcs = longestCommonSubsequenceLength(valueTokensA, valueTokensB, tokensEquivalent);
  const differingValueTokenCount =
    valueTokensA.length + valueTokensB.length - 2 * valueLcs;
  const valueTokenCount = valueTokensA.length + valueTokensB.length;
  const sampleDifferingValueTokens = [...valueTokensA.slice(0, 4), ...valueTokensB.slice(0, 4)].slice(
    0,
    8
  );

  const denom = Math.max(tokensA.length + tokensB.length, 1);
  const valueDenom = Math.max(valueTokenCount, 1);

  return {
    leftTokenCount: tokensA.length,
    rightTokenCount: tokensB.length,
    equalTokenCount,
    differingTokenCount,
    differingValueTokenCount,
    valueTokenCount,
    fractionDifferingTokens: differingTokenCount / denom,
    fractionDifferingValueTokens: differingValueTokenCount / valueDenom,
    sampleDifferingValueTokens,
  };
}

export function buildDuplicateFeatureVector(context: DuplicatePairContext): DuplicateFeatureVector {
  const leftText = `${context.left.filename}\n${context.left.title}\n${context.left.extractedTextSample}`;
  const rightText = `${context.right.filename}\n${context.right.title}\n${context.right.extractedTextSample}`;
  const alignment = compareDocumentTexts(leftText, rightText);
  const tokensA = tokenizeDocumentText(leftText);
  const tokensB = tokenizeDocumentText(rightText);
  const leftPages = context.left.pageCount ?? 0;
  const rightPages = context.right.pageCount ?? 0;
  const maxPages = Math.max(leftPages, rightPages, 1);
  const relativePageCountDiff =
    leftPages > 0 && rightPages > 0 ? Math.abs(leftPages - rightPages) / maxPages : 0;

  return {
    embeddingSimilarity: context.embeddingSimilarity,
    fractionDifferingTokens: alignment.fractionDifferingTokens,
    fractionDifferingValueTokens: alignment.fractionDifferingValueTokens,
    relativePageCountDiff,
    perceptualPageHashDistance: context.perceptualPageHashDistance ?? 0,
    shingleJaccardDistance: shingleJaccardDistance(tokensA, tokensB),
  };
}

export interface DuplicatePairDifferenceRow {
  label: string;
  primary: string;
  other: string;
  differs: boolean;
}

export function duplicatePairDifferenceRows(
  left: DuplicateCompareDocumentInput,
  right: DuplicateCompareDocumentInput,
  embeddingSimilarity: number | null
): DuplicatePairDifferenceRow[] {
  const leftText = `${left.filename}\n${left.title}\n${left.extractedTextSample}`;
  const rightText = `${right.filename}\n${right.title}\n${right.extractedTextSample}`;
  const alignment = compareDocumentTexts(leftText, rightText);
  const sim =
    embeddingSimilarity != null ? `${String(Math.round(embeddingSimilarity * 100))}%` : '—';

  return [
    {
      label: 'contentDiff',
      primary: `${String(Math.round((1 - alignment.fractionDifferingTokens) * 100))}% aligned`,
      other: `${alignment.differingTokenCount} differing tokens`,
      differs: alignment.fractionDifferingTokens > 0.05,
    },
    {
      label: 'valueDiff',
      primary: `${String(Math.round(alignment.fractionDifferingValueTokens * 100))}% value tokens differ`,
      other: alignment.sampleDifferingValueTokens.join(', ') || '—',
      differs: alignment.fractionDifferingValueTokens > 0.02,
    },
    {
      label: 'filename',
      primary: left.filename,
      other: right.filename,
      differs: left.filename.trim() !== right.filename.trim(),
    },
    {
      label: 'title',
      primary: left.title,
      other: right.title,
      differs: left.title.trim() !== right.title.trim(),
    },
    {
      label: 'embedding',
      primary: sim,
      other: sim,
      differs: false,
    },
  ];
}
