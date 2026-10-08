import { dedupeExtractedFields, type ExtractedField } from '@docuvate/contracts';

/** Merge patches by storage key, then collapse semantic duplicates (e.g. plain `date` + `global:datum`). */
export function mergeExtractedFields(
  existing: ExtractedField[],
  patches: ExtractedField[]
): ExtractedField[] {
  if (patches.length === 0) {
    return dedupeExtractedFields(existing);
  }
  const merged = new Map(existing.map((f) => [f.key, f]));
  let changed = false;
  for (const patch of patches) {
    const prev = merged.get(patch.key);
    if (prev?.value === patch.value && prev.confidence === patch.confidence) {
      continue;
    }
    merged.set(patch.key, patch);
    changed = true;
  }
  const combined = changed ? [...merged.values()] : existing;
  return dedupeExtractedFields(combined);
}
