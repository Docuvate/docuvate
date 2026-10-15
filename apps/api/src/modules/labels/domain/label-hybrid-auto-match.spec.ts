// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  predictLabelHybrid,
  trainLabelHybridModel,
  type LabelHybridTrainingExample,
} from './label-hybrid-auto-match.js';

function example(
  tagId: string,
  seed: number,
  text: string
): LabelHybridTrainingExample {
  const embedding = Array.from({ length: 8 }, (_, i) => Math.sin(seed * (i + 1) * 0.7));
  return { tagId, embedding, text };
}

describe('label-hybrid-auto-match', () => {
  it('rejects out-of-family documents at high LOO precision', () => {
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
    const trained = model!;

    const unrelated = predictLabelHybrid(
      trained,
      example('x', 99, 'personalfragebogen mitarbeiter onboarding json struktur').embedding,
      'personalfragebogen mitarbeiter onboarding json struktur agenda kickoff meeting'
    );
    expect(unrelated.tagId).toBeNull();
  });
});
