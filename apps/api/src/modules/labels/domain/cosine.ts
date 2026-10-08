export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function mergeCentroid(
  current: number[] | null,
  sampleCount: number,
  addition: number[]
): { centroid: number[]; sampleCount: number } {
  if (!current || current.length === 0 || sampleCount <= 0) {
    return { centroid: [...addition], sampleCount: 1 };
  }
  const n = sampleCount;
  const next = current.map((v, i) => (v * n + (addition[i] ?? 0)) / (n + 1));
  return { centroid: next, sampleCount: n + 1 };
}
