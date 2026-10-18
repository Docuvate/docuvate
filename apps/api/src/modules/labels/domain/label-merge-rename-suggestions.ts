// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { namesAreNearDuplicate } from '../../../shared/domain/label-name-similarity.js';
import { cosineSimilarity } from './cosine.js';

export interface TagPairSignal {
  tagId: string;
  name: string;
  centroid: number[];
}

export type MergeRenameSuggestion =
  | {
      kind: 'merge';
      id: string;
      tagIds: [string, string];
      names: [string, string];
      score: number;
      reason: string;
    }
  | {
      kind: 'rename';
      id: string;
      tagId: string;
      fromName: string;
      toName: string;
      score: number;
      reason: string;
    };

export function suggestMergeAndRename(
  tags: TagPairSignal[],
  dismissedKeys: Set<string>
): MergeRenameSuggestion[] {
  const out: MergeRenameSuggestion[] = [];

  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i];
      const b = tags[j];
      const idPair = [a.tagId, b.tagId].sort();
      const mergeId = `merge:${idPair[0]}:${idPair[1]}`;
      if (dismissedKeys.has(mergeId)) {
        continue;
      }

      const nameDup = namesAreNearDuplicate(a.name, b.name);
      let sim = 0;
      if (a.centroid.length > 0 && b.centroid.length > 0) {
        sim = cosineSimilarity(a.centroid, b.centroid);
      }

      if (nameDup || sim >= 0.9) {
        out.push({
          kind: 'merge',
          id: mergeId,
          tagIds: [a.tagId, b.tagId],
          names: [a.name, b.name],
          score: Math.min(0.99, nameDup ? 0.88 + sim * 0.1 : sim),
          reason: nameDup
            ? `Sehr ähnliche Namen (${a.name} / ${b.name})`
            : `Embedding-Zentren sehr nah (${String(Math.round(sim * 100))} % Ähnlichkeit)`,
        });
      }
    }
  }

  const seenIds = new Set<string>();
  return out
    .filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 6);
}
