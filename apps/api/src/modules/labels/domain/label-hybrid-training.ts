// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  canTrainLabelHybridModel,
  type LabelHybridModel,
  type LabelHybridPrediction,
  type LabelHybridTrainingExample,
  predictLabelHybrid,
  trainLabelHybridModel,
} from './label-hybrid-auto-match.js';
import type { LabelHybridTrainRuntimeOptions } from './label-hybrid-training-config.js';
import {
  capLabelHybridTrainingExamples,
  sampleRowsForVocabulary,
  trimLabelHybridDocumentRows,
} from './label-hybrid-training-corpus.js';


export interface LabelHybridDocumentRow {
  documentId: string;
  embedding: number[];
  nonInboxTagIds: string[];
  text: string;
}

export function buildLabelHybridTrainingExamples(
  rows: readonly LabelHybridDocumentRow[]
): LabelHybridTrainingExample[] {
  const out: LabelHybridTrainingExample[] = [];
  for (const row of rows) {
    if (row.embedding.length === 0 || row.nonInboxTagIds.length === 0) {
      continue;
    }
    for (const tagId of row.nonInboxTagIds) {
      out.push({
        tagId,
        embedding: row.embedding,
        text: row.text,
      });
    }
  }
  return out;
}

export function trainUserLabelHybridModel(
  rows: readonly LabelHybridDocumentRow[],
  options?: LabelHybridTrainRuntimeOptions
): LabelHybridModel | null {
  const trimmedRows = trimLabelHybridDocumentRows(rows);
  const examples = buildLabelHybridTrainingExamples(trimmedRows);
  const capped = capLabelHybridTrainingExamples(examples);
  if (!canTrainLabelHybridModel(capped)) {
    return null;
  }
  const vocabRows = sampleRowsForVocabulary(trimmedRows).map((row) => ({ text: row.text }));
  return trainLabelHybridModel(capped, vocabRows, options);
}

export function classifyWithLabelHybrid(
  model: LabelHybridModel,
  row: Pick<LabelHybridDocumentRow, 'embedding' | 'text'>
): LabelHybridPrediction {
  return predictLabelHybrid(model, row.embedding, row.text);
}

export function evaluateLabelHybridLeaveOneOut(
  rows: readonly LabelHybridDocumentRow[]
): { precision: number; coverage: number; evaluated: number } {
  const labeledDocIds = [
    ...new Set(
      rows.filter((row) => row.nonInboxTagIds.length > 0).map((row) => row.documentId)
    ),
  ];
  if (labeledDocIds.length === 0) {
    return { precision: 1, coverage: 0, evaluated: 0 };
  }
  let predicted = 0;
  let correct = 0;
  let evaluated = 0;
  for (const heldDocId of labeledDocIds) {
    const heldRows = rows.filter((row) => row.documentId === heldDocId);
    const trainRows = rows.filter((row) => row.documentId !== heldDocId);
    const model = trainUserLabelHybridModel(trainRows);
    if (!model) {
      continue;
    }
    for (const held of heldRows) {
      if (held.nonInboxTagIds.length === 0 || held.embedding.length === 0) {
        continue;
      }
      for (const expectedTagId of held.nonInboxTagIds) {
        evaluated += 1;
        const result = predictLabelHybrid(model, held.embedding, held.text);
        if (result.tagId == null) {
          continue;
        }
        predicted += 1;
        if (result.tagId === expectedTagId) {
          correct += 1;
        }
      }
    }
  }
  const precision = predicted > 0 ? correct / predicted : 1;
  const coverage = evaluated > 0 ? predicted / evaluated : 0;
  return { precision, coverage, evaluated };
}
