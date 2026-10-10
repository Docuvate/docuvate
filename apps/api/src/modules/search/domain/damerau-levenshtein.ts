// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Damerau-Levenshtein distance (adjacent transpositions count as one edit). */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const maxDist = al + bl;
  const da = new Map<string, number>();
  const d: number[][] = Array.from({ length: al + 2 }, () => Array<number>(bl + 2).fill(0));

  d[0][0] = maxDist;
  for (let i = 0; i <= al; i += 1) {
    d[i + 1][0] = maxDist;
    d[i + 1][1] = i;
  }
  for (let j = 0; j <= bl; j += 1) {
    d[0][j + 1] = maxDist;
    d[1][j + 1] = j;
  }

  for (let i = 1; i <= al; i += 1) {
    let db = 0;
    for (let j = 1; j <= bl; j += 1) {
      const i1 = da.get(b[j - 1]) ?? 0;
      const j1 = db;
      let cost = 1;
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
        db = j;
      }
      d[i + 1][j + 1] = Math.min(
        d[i][j] + cost,
        d[i + 1][j] + 1,
        d[i][j + 1] + 1,
        d[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1)
      );
    }
    da.set(a[i - 1], i);
  }

  return d[al + 1][bl + 1];
}

export function isTypoWithinDistance(a: string, b: string, maxDistance: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > maxDistance) return false;
  return damerauLevenshtein(a, b) <= maxDistance;
}
