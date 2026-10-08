import type { ExtractionCompareItem } from '@docuvate/contracts';

export function pickHeuristicArenaWinner(items: ExtractionCompareItem[]): string | null {
  const ok = items.filter((item) => !item.error && (item.text?.trim().length ?? 0) > 0);
  if (ok.length === 0) {
    return null;
  }
  ok.sort((a, b) => (b.charCount ?? b.text?.length ?? 0) - (a.charCount ?? a.text?.length ?? 0));
  return ok[0]?.engine ?? null;
}
