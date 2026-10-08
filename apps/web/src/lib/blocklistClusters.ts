/** Client-side grouping for pattern proposal UI (mirrors API heuristics). */
export function normalizeBlocklistKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function blocklistPhrasesRelated(a: string, b: string): boolean {
  const keyA = normalizeBlocklistKey(a);
  const keyB = normalizeBlocklistKey(b);
  if (!keyA || !keyB) {
    return false;
  }
  if (keyA === keyB) {
    return true;
  }
  const shorter = keyA.length <= keyB.length ? keyA : keyB;
  const longer = keyA.length <= keyB.length ? keyB : keyA;
  return shorter.length >= 4 && longer.includes(shorter);
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
      if (cluster.some((existing) => blocklistPhrasesRelated(existing, phrase))) {
        cluster.push(phrase);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push([phrase]);
    }
  }
  return clusters.filter((cluster) => cluster.length >= 2);
}
