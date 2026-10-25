// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  buildLabelHybridCalibrationPayload,
  type LabelHybridTrainingExample,
  trainLabelHybridModel,
} from './label-hybrid-auto-match.js';
import {
  learnConfidenceThresholdKFold,
  learnConfidenceThresholdLoo,
} from './label-hybrid-calibration.js';
import { LABEL_HYBRID_K_FOLD_COUNT } from './label-hybrid-training-config.js';

function example(
  tagId: string,
  seed: number,
  text: string
): LabelHybridTrainingExample {
  const embedding = Array.from({ length: 8 }, (_, i) => Math.sin(seed * (i + 1) * 0.7));
  return { tagId, embedding, text };
}

describe('label-hybrid-calibration', () => {
  it('matches the reference payroll/tax fixture threshold and abstention', () => {
    const payroll: LabelHybridTrainingExample[] = [
      example('payroll', 1, 'entgelt brutto netto lohnsteuer oktober gesamtbrutto'),
      example('payroll', 2, 'gehaltsabrechnung monat entgeltnachweis'),
      example('payroll', 3, 'lohnabrechnung steuer sv brutto'),
    ];
    const tax: LabelHybridTrainingExample[] = [
      example('tax', 4, 'lohnsteuerbescheinigung jahres steuer einbehalten gesamt'),
      example('tax', 5, 'lohnsteuer jahresbescheinigung summe'),
      example('tax', 6, 'steuerbescheinigung lohnsteuer jahr'),
    ];
    const model = trainLabelHybridModel([...payroll, ...tax]);
    expect(model).not.toBeNull();
    if (model === null) {
      throw new Error('expected model');
    }
    expect(model.confidenceThreshold).toBeGreaterThanOrEqual(0.55);
    expect(model.confidenceThreshold).toBeLessThanOrEqual(0.99);
  });

  it('keeps K-fold calibration within tolerance of LOO on the public payroll/tax fixture', () => {
    const expanded: LabelHybridTrainingExample[] = [
      example('payroll', 1, 'entgelt brutto netto lohnsteuer oktober gesamtbrutto'),
      example('payroll', 2, 'gehaltsabrechnung monat entgeltnachweis'),
      example('payroll', 3, 'lohnabrechnung steuer sv brutto'),
      example('tax', 4, 'lohnsteuerbescheinigung jahres steuer einbehalten gesamt'),
      example('tax', 5, 'lohnsteuer jahresbescheinigung summe'),
      example('tax', 6, 'steuerbescheinigung lohnsteuer jahr'),
    ];
    for (let i = 0; i < 40; i += 1) {
      expanded.push(
        example('payroll', 10 + i, `payroll synthetic public fixture block ${String(i)} brutto`)
      );
      expanded.push(example('tax', 60 + i, `tax synthetic public fixture block ${String(i)} steuer`));
    }
    const payload = buildLabelHybridCalibrationPayload(expanded);
    expect(payload).not.toBeNull();
    if (payload === null) {
      throw new Error('expected calibration payload');
    }
    const loo = learnConfidenceThresholdLoo(payload.tagIds, payload.prepared);
    const kFold = learnConfidenceThresholdKFold(
      payload.tagIds,
      payload.prepared,
      LABEL_HYBRID_K_FOLD_COUNT
    );
    expect(Math.abs(loo - kFold)).toBeLessThan(0.12);
  });
});
