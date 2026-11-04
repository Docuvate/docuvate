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
import type { LabelHybridDocumentRow } from './label-hybrid-document-row.js';
import type { LabelHybridTrainRuntimeOptions } from './label-hybrid-training-config.js';
import {
  capLabelHybridTrainingExamples,
  sampleRowsForVocabulary,
  trimLabelHybridDocumentRows,
} from './label-hybrid-training-corpus.js';

function buildLabelHybridTrainingExamples(
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
