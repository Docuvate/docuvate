// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelHybridTrainingExample } from './label-hybrid-auto-match.js';
import type { LabelHybridDocumentRow } from './label-hybrid-training.js';
import {
  labelHybridMaxExamplesPerTag,
  labelHybridMaxTrainingExamples,
  labelHybridMaxVocabDocuments,
  labelHybridTextCharsForFeatures,
} from './label-hybrid-training-config.js';

export function trimLabelHybridRowText(text: string): string {
  const limit = labelHybridTextCharsForFeatures();
  if (text.length <= limit) {
    return text;
  }
  return text.slice(0, limit);
}

export function trimLabelHybridDocumentRows(
  rows: readonly LabelHybridDocumentRow[]
): LabelHybridDocumentRow[] {
  return rows.map((row) => ({
    ...row,
    text: trimLabelHybridRowText(row.text),
  }));
}

function capExamplesPerTag(
  examples: readonly LabelHybridTrainingExample[],
  maxPerTag: number,
  maxTotal: number
): LabelHybridTrainingExample[] {
  const byTag = new Map<string, LabelHybridTrainingExample[]>();
  for (const example of examples) {
    const list = byTag.get(example.tagId) ?? [];
    list.push(example);
    byTag.set(example.tagId, list);
  }
  const capped: LabelHybridTrainingExample[] = [];
  const tagIds = [...byTag.keys()].sort();
  for (const tagId of tagIds) {
    const list = byTag.get(tagId) ?? [];
    list.sort((a, b) => a.text.localeCompare(b.text));
    for (const example of list.slice(0, maxPerTag)) {
      capped.push(example);
      if (capped.length >= maxTotal) {
        return capped;
      }
    }
  }
  return capped;
}

export function capLabelHybridTrainingExamples(
  examples: readonly LabelHybridTrainingExample[]
): LabelHybridTrainingExample[] {
  if (examples.length === 0) {
    return [];
  }
  const maxPerTag = labelHybridMaxExamplesPerTag();
  const maxTotal = labelHybridMaxTrainingExamples();
  if (examples.length <= maxTotal) {
    const perTagOk = capExamplesPerTag(examples, maxPerTag, maxTotal);
    return perTagOk;
  }
  return capExamplesPerTag(examples, maxPerTag, maxTotal);
}

/** Deterministic document subsample for vocabulary / IDF (avoids scanning every chunk). */
export function sampleRowsForVocabulary(
  rows: readonly LabelHybridDocumentRow[]
): LabelHybridDocumentRow[] {
  const maxDocs = labelHybridMaxVocabDocuments();
  if (rows.length <= maxDocs) {
    return [...rows];
  }
  const sorted = [...rows].sort((a, b) => a.documentId.localeCompare(b.documentId));
  const stride = Math.ceil(sorted.length / maxDocs);
  const sampled: LabelHybridDocumentRow[] = [];
  for (let index = 0; index < sorted.length && sampled.length < maxDocs; index += stride) {
    sampled.push(sorted[index]);
  }
  return sampled;
}
