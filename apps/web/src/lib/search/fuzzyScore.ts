// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from './normalizeSearchText';

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) row[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Higher is better (0..1). Used for settings/actions registry. */
export function fuzzyMatchScore(query: string, candidate: string): number {
  const q = normalizeSearchText(query.trim());
  const c = normalizeSearchText(candidate.trim());
  if (!q || !c) return 0;
  if (c.includes(q)) return 1;
  if (q.includes(c)) return 0.92;
  const dist = levenshtein(q, c);
  const maxLen = Math.max(q.length, c.length);
  const threshold = maxLen <= 5 ? 1 : maxLen <= 10 ? 2 : 3;
  if (dist > threshold) return 0;
  return 1 - dist / (maxLen + 1);
}

export function highlightFuzzySpans(
  text: string,
  query: string
): { start: number; end: number }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx >= 0) return [{ start: idx, end: idx + q.length }];
  const words = text.split(/(\s+)/);
  let offset = 0;
  const spans: { start: number; end: number }[] = [];
  for (const word of words) {
    if (/\S/.test(word) && fuzzyMatchScore(query, word) >= 0.55) {
      spans.push({ start: offset, end: offset + word.length });
    }
    offset += word.length;
  }
  return spans;
}
