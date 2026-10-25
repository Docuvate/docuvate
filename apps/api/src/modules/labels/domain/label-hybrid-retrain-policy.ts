// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelHybridDocumentRow } from './label-hybrid-training.js';
import {
  labelHybridRetrainMinDelta,
  labelHybridRetrainMinDeltaRatio,
} from './label-hybrid-training-config.js';

export interface LabelHybridRetrainBaseline {
  exampleCount: number;
  tagIds: ReadonlySet<string>;
  /** False until a model has been trained successfully at least once. */
  hasTrainedModel: boolean;
}

export function countConfirmedLabeledExamples(rows: readonly LabelHybridDocumentRow[]): number {
  let count = 0;
  for (const row of rows) {
    if (row.embedding.length === 0) {
      continue;
    }
    count += row.nonInboxTagIds.length;
  }
  return count;
}

export function confirmedLabeledTagIds(rows: readonly LabelHybridDocumentRow[]): Set<string> {
  const tagIds = new Set<string>();
  for (const row of rows) {
    if (row.embedding.length === 0) {
      continue;
    }
    for (const tagId of row.nonInboxTagIds) {
      tagIds.add(tagId);
    }
  }
  return tagIds;
}

export function baselineFromTrainedRows(
  rows: readonly LabelHybridDocumentRow[]
): LabelHybridRetrainBaseline {
  return {
    exampleCount: countConfirmedLabeledExamples(rows),
    tagIds: confirmedLabeledTagIds(rows),
    hasTrainedModel: true,
  };
}

export function emptyRetrainBaseline(): LabelHybridRetrainBaseline {
  return { exampleCount: 0, tagIds: new Set(), hasTrainedModel: false };
}

function exampleCountDelta(baselineCount: number, pendingCount: number): number {
  return Math.abs(pendingCount - baselineCount);
}

export function hasNewConfirmedLabelClass(
  baseline: LabelHybridRetrainBaseline,
  pendingRows: readonly LabelHybridDocumentRow[]
): boolean {
  const pendingTags = confirmedLabeledTagIds(pendingRows);
  for (const tagId of pendingTags) {
    if (!baseline.tagIds.has(tagId)) {
      return true;
    }
  }
  return false;
}

export function requiredExampleDeltaForRetrain(baselineExampleCount: number): number {
  const abs = labelHybridRetrainMinDelta();
  const relative = Math.ceil(baselineExampleCount * labelHybridRetrainMinDeltaRatio());
  return Math.max(abs, relative);
}

export type RetrainSignificance =
  | { kind: 'cold_start' }
  | { kind: 'new_label_class' }
  | { kind: 'example_delta'; delta: number; required: number };

export function evaluateRetrainSignificance(
  baseline: LabelHybridRetrainBaseline,
  pendingRows: readonly LabelHybridDocumentRow[]
): RetrainSignificance | null {
  if (!baseline.hasTrainedModel) {
    return { kind: 'cold_start' };
  }
  if (hasNewConfirmedLabelClass(baseline, pendingRows)) {
    return { kind: 'new_label_class' };
  }
  const pendingCount = countConfirmedLabeledExamples(pendingRows);
  const delta = exampleCountDelta(baseline.exampleCount, pendingCount);
  const required = requiredExampleDeltaForRetrain(baseline.exampleCount);
  if (delta >= required) {
    return { kind: 'example_delta', delta, required };
  }
  return null;
}
