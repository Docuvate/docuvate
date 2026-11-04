// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  namesAreNearDuplicate,
  normalizeLabelKey,
} from '../../../shared/domain/label-name-similarity.js';

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
