import type { MatchingAlgorithm } from '@docuvate/contracts';

export interface MatchInput {
  algorithm: MatchingAlgorithm;
  pattern: string;
  content: string;
}

function normalizeContent(content: string): string {
  return content.trim().toLowerCase();
}

function splitPatterns(pattern: string): string[] {
  return pattern
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function contentMatchesRule(input: MatchInput): boolean {
  const { algorithm, pattern, content } = input;
  if (algorithm === 'none' || !pattern.trim()) {
    return false;
  }

  const haystack = normalizeContent(content);
  const needle = pattern.trim();

  switch (algorithm) {
    case 'any': {
      const parts = splitPatterns(pattern);
      if (parts.length === 0) {
        return false;
      }
      return parts.some((part) => haystack.includes(part.toLowerCase()));
    }
    case 'all': {
      const parts = splitPatterns(pattern);
      if (parts.length === 0) {
        return false;
      }
      return parts.every((part) => haystack.includes(part.toLowerCase()));
    }
    case 'exact':
      return haystack === needle.toLowerCase();
    case 'regex': {
      try {
        const re = new RegExp(needle, 'i');
        return re.test(content);
      } catch {
        return false;
      }
    }
    default: {
      const _exhaustive: never = algorithm;
      return _exhaustive;
    }
  }
}

export function shouldAutoAssignTag(algorithm: MatchingAlgorithm): boolean {
  return algorithm === 'all' || algorithm === 'exact' || algorithm === 'regex';
}

export function shouldSuggestTag(algorithm: MatchingAlgorithm): boolean {
  return algorithm === 'any';
}
