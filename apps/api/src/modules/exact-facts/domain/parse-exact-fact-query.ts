// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { ParsedExactFactQuery } from './exact-fact-query.types.js';
import { normalizePredicateKey } from './normalize-predicate-key.js';

const SUM_KEYWORDS = new Set([
  'summe',
  'gesamt',
  'gesamtsumme',
  'total',
  'sum',
  'add',
  'addieren',
  'zusammen',
  'insgesamt',
]);

const COUNT_KEYWORDS = new Set([
  'anzahl',
  'count',
  'wie',
  'many',
  'viele',
  'how',
]);

const STOP_WORDS = new Set([
  'was',
  'ist',
  'sind',
  'war',
  'waren',
  'the',
  'what',
  'is',
  'are',
  'was',
  'wie',
  'how',
  'much',
  'viel',
  'hoch',
  'steht',
  'show',
  'zeige',
  'mir',
  'me',
  'my',
  'mein',
  'meine',
  'meinen',
  'meiner',
  'in',
  'im',
  'in der',
  'in dem',
  'for',
  'für',
  'von',
  'vom',
  'der',
  'die',
  'das',
  'den',
  'dem',
  'des',
  'ein',
  'eine',
  'einer',
  'eines',
  'a',
  'an',
  'and',
  'und',
  'or',
  'oder',
  'bitte',
  'please',
  'hello',
  'hi',
  'hey',
  'document',
  'documents',
  'dokument',
  'dokumente',
  'library',
  'bibliothek',
  'all',
  'alle',
  'aller',
  'allers',
  'über',
  'about',
  '?',
]);

function tokenize(message: string): string[] {
  const normalized = message
    .replace(/[?!.,;:()[\]{}«»„“"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) {
    return [];
  }
  return normalized.split(' ').map((token) => token.trim()).filter((token) => token.length > 0);
}

function extractYearHint(tokens: string[]): { yearHint: number | null; rest: string[] } {
  const rest: string[] = [];
  let yearHint: number | null = null;
  for (const token of tokens) {
    if (/^(19|20)\d{2}$/.test(token)) {
      const year = Number(token);
      if (year >= 1900 && year <= 2100) {
        yearHint = year;
        continue;
      }
    }
    rest.push(token);
  }
  return { yearHint, rest };
}

function detectQueryKind(tokens: string[]): ParsedExactFactQuery['kind'] | null {
  const lowered = tokens.map((t) => t.toLocaleLowerCase('de-DE'));
  const hasSum = lowered.some((t) => SUM_KEYWORDS.has(t));
  const hasCountPhrase =
    (lowered.includes('wie') && lowered.includes('viele')) ||
    (lowered.includes('how') && lowered.includes('many')) ||
    lowered.includes('anzahl') ||
    lowered.includes('count');
  const hasFactCountContext =
    lowered.includes('facts') ||
    lowered.includes('fakten') ||
    lowered.includes('werte') ||
    lowered.includes('beträge') ||
    lowered.includes('betraege') ||
    lowered.includes('amounts') ||
    lowered.includes('einträge') ||
    lowered.includes('eintraege');
  const hasCount = hasCountPhrase && (hasFactCountContext || filterPredicateTokens(tokens).length > 0);
  if (hasSum && !hasCount) {
    return 'sum_amounts';
  }
  if (hasCount) {
    return 'count_facts';
  }
  return null;
}

function filterPredicateTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (const raw of tokens) {
    const folded = normalizePredicateKey(raw);
    if (!folded || STOP_WORDS.has(folded)) {
      continue;
    }
    if (SUM_KEYWORDS.has(folded) || COUNT_KEYWORDS.has(folded)) {
      continue;
    }
    out.push(folded);
  }
  return out;
}

/**
 * CPU-only parser for exact fact lookups and aggregations (DE/EN). Returns null when the
 * message does not look like a structured fact question.
 */
export function parseExactFactQuery(message: string): ParsedExactFactQuery | null {
  const rawTokens = tokenize(message);
  if (rawTokens.length === 0) {
    return null;
  }

  const explicitKind = detectQueryKind(rawTokens);
  const { yearHint, rest: afterYear } = extractYearHint(rawTokens);
  const predicateTokens = filterPredicateTokens(afterYear);

  if (explicitKind === 'sum_amounts') {
    return { kind: 'sum_amounts', predicateTokens, yearHint };
  }
  if (explicitKind === 'count_facts') {
    return { kind: 'count_facts', predicateTokens, yearHint };
  }

  if (predicateTokens.length === 0 && yearHint == null) {
    return null;
  }

  return {
    kind: 'lookup',
    predicateTokens,
    yearHint,
  };
}
