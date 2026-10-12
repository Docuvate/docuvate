// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length !== a.length) {
    return 0;
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) {
    return 0;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    return [];
  }
  const dim = vectors[0].length;
  const acc = new Array<number>(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i += 1) {
      acc[i] += vec[i] ?? 0;
    }
  }
  const n = vectors.length;
  return acc.map((v) => v / n);
}
