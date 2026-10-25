// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import {
  baselineFromTrainedRows,
  emptyRetrainBaseline,
  evaluateRetrainSignificance,
  requiredExampleDeltaForRetrain,
} from './label-hybrid-retrain-policy.js';
import type { LabelHybridDocumentRow } from './label-hybrid-training.js';

function labeledRow(documentId: string, tagId: string): LabelHybridDocumentRow {
  return {
    documentId,
    embedding: [0.1, 0.2],
    nonInboxTagIds: [tagId],
    text: 'text',
  };
}

describe('label-hybrid-retrain-policy', () => {
  afterEach(() => {
    delete process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA'];
    delete process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA_RATIO'];
  });

  it('requires at least absolute min delta when baseline is small', () => {
    process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA'] = '5';
    process.env['DOCUVATE_LABEL_RETRAIN_MIN_DELTA_RATIO'] = '0.02';
    expect(requiredExampleDeltaForRetrain(10)).toBe(5);
    expect(requiredExampleDeltaForRetrain(400)).toBe(8);
  });

  it('treats cold start as always significant', () => {
    const pending = [labeledRow('d1', 'a'), labeledRow('d2', 'a')];
    expect(evaluateRetrainSignificance(emptyRetrainBaseline(), pending)?.kind).toBe('cold_start');
  });

  it('blocks retrain when delta is below threshold', () => {
    const trained = [labeledRow('d1', 'a'), labeledRow('d2', 'b'), labeledRow('d3', 'b')];
    const baseline = baselineFromTrainedRows(trained);
    const pending = [...trained, labeledRow('d4', 'a')];
    expect(evaluateRetrainSignificance(baseline, pending)).toBeNull();
  });

  it('allows retrain when delta meets threshold', () => {
    const trained: LabelHybridDocumentRow[] = [];
    for (let i = 0; i < 10; i += 1) {
      trained.push(labeledRow(`d${String(i)}`, 'a'));
    }
    const baseline = baselineFromTrainedRows(trained);
    const pending = [
      ...trained,
      labeledRow('n1', 'a'),
      labeledRow('n2', 'a'),
      labeledRow('n3', 'a'),
      labeledRow('n4', 'a'),
      labeledRow('n5', 'a'),
    ];
    const sig = evaluateRetrainSignificance(baseline, pending);
    expect(sig?.kind).toBe('example_delta');
  });

  it('allows retrain when a new label class appears', () => {
    const trained = [labeledRow('d1', 'a'), labeledRow('d2', 'a')];
    const baseline = baselineFromTrainedRows(trained);
    const pending = [...trained, labeledRow('d3', 'brand-new-tag')];
    expect(evaluateRetrainSignificance(baseline, pending)?.kind).toBe('new_label_class');
  });
});
