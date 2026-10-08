function fold(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '');
}

export function suggestFieldNames(
  partial: string,
  defs: Array<{ key: string; label: string }>,
  limit = 8
): string[] {
  const probe = fold(partial);
  if (!probe) return [];
  return defs
    .map((def) => {
      const keyFold = fold(def.key);
      const labelFold = fold(def.label);
      let score = 0;
      if (keyFold.startsWith(probe) || labelFold.startsWith(probe)) score += 3;
      if (keyFold.includes(probe) || labelFold.includes(probe)) score += 1;
      return { key: def.key, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.key);
}
