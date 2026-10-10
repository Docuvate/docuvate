// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { isRecord, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { namesAreNearDuplicate, normalizeLabelKey } from './label-vocabulary.js';

const MAX_BLOCKLIST_PATTERN_LENGTH = 200;

export function compileBlocklistPattern(pattern: string): RegExp | null {
  const trimmed = pattern.trim();
  if (!trimmed || trimmed.length > MAX_BLOCKLIST_PATTERN_LENGTH) {
    return null;
  }
  try {
    return new RegExp(trimmed, 'i');
  } catch {
    return null;
  }
}

export function matchesBlocklistPattern(candidateName: string, patterns: string[]): boolean {
  if (!candidateName.trim() || patterns.length === 0) {
    return false;
  }
  for (const pattern of patterns) {
    const re = compileBlocklistPattern(pattern);
    if (re?.test(candidateName)) {
      return true;
    }
  }
  return false;
}

export function isBlockedLabelCandidate(
  candidateName: string,
  blockPhrases: string[],
  blockPatterns: string[] = []
): boolean {
  return (
    matchesUserBlocklist(candidateName, blockPhrases) ||
    matchesBlocklistPattern(candidateName, blockPatterns)
  );
}

export function phrasesAreRelated(a: string, b: string): boolean {
  if (namesAreNearDuplicate(a, b)) {
    return true;
  }
  const keyA = normalizeLabelKey(a).replace(/[^a-z0-9]+/g, '');
  const keyB = normalizeLabelKey(b).replace(/[^a-z0-9]+/g, '');
  if (!keyA || !keyB) {
    return false;
  }
  if (keyA === keyB) {
    return true;
  }
  const shorter = keyA.length <= keyB.length ? keyA : keyB;
  const longer = keyA.length <= keyB.length ? keyB : keyA;
  if (shorter.length >= 4 && longer.includes(shorter)) {
    return true;
  }
  return false;
}

export function clusterBlocklistPhrases(phrases: string[]): string[][] {
  const unique = [...new Set(phrases.map((p) => p.trim()).filter((p) => p.length >= 2))];
  if (unique.length < 2) {
    return [];
  }
  const clusters: string[][] = [];
  for (const phrase of unique) {
    let placed = false;
    for (const cluster of clusters) {
      if (cluster.some((existing) => phrasesAreRelated(existing, phrase))) {
        cluster.push(phrase);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push([phrase]);
    }
  }
  return clusters.filter((c) => c.length >= 2);
}

export function parseBlocklistPatternProposal(raw: string): {
  pattern: string;
  explanation: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const jsonMatch = /\{[\s\S]*\}/.exec(trimmed);
  const jsonText = jsonMatch?.[0] ?? trimmed;
  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!isRecord(parsed)) {
      return null;
    }
    const pattern = parseString(parsed.pattern).trim();
    const explanation = parseString(parsed.explanation).trim();
    if (!pattern || !compileBlocklistPattern(pattern)) {
      return null;
    }
    return { pattern, explanation: explanation || 'Vorgeschlagenes Muster' };
  } catch {
    return null;
  }
}

export function matchesUserBlocklist(candidateName: string, blockPhrases: string[]): boolean {
  const key = normalizeLabelKey(candidateName);
  if (!key || blockPhrases.length === 0) {
    return false;
  }
  for (const phrase of blockPhrases) {
    const blockKey = normalizeLabelKey(phrase);
    if (!blockKey) {
      continue;
    }
    if (key === blockKey || namesAreNearDuplicate(candidateName, phrase)) {
      return true;
    }
    if (blockKey.length >= 3 && key.includes(blockKey)) {
      return true;
    }
    if (key.length >= 3 && blockKey.includes(key)) {
      return true;
    }
  }
  return false;
}

export function phraseFromRecommendationKey(
  recommendationId: string,
  phraseHint?: string
): string | null {
  const hint = phraseHint?.trim();
  if (hint) {
    return hint;
  }
  if (recommendationId.startsWith('new:')) {
    return recommendationId.slice(4);
  }
  return null;
}
