// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  buildDuplicateFeatureVector,
  decideDuplicatePair,
  DEFAULT_DUPLICATE_CLASSIFIER_MODEL,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

/** Round synthetic totals for annual-report duplicate classifier scenarios. */
const SYNTHETIC_EQUITY_2024 = '1234567.00';
const SYNTHETIC_EQUITY_2025 = '2345678.00';

function annualReportBody(periodEnd: string, equity: string): string {
  return `Annual financial statements package
Entity reference DEMO-900042
Reporting period end ${periodEnd}
Total equity ${equity}
Balance sheet section alpha beta gamma
Notes to the financial statements static paragraph`;
}

function pairDecision(
  leftFilename: string,
  leftTitle: string,
  leftBody: string,
  rightFilename: string,
  rightTitle: string,
  rightBody: string,
  embeddingSimilarity: number
) {
  const features = buildDuplicateFeatureVector({
    left: {
      documentId: 'left',
      filename: leftFilename,
      title: leftTitle,
      extractedTextSample: leftBody,
      pageCount: 12,
    },
    right: {
      documentId: 'right',
      filename: rightFilename,
      title: rightTitle,
      extractedTextSample: rightBody,
      pageCount: 11,
    },
    embeddingSimilarity,
    perceptualPageHashDistance: null,
  });
  return decideDuplicatePair(DEFAULT_DUPLICATE_CLASSIFIER_MODEL, features, 0);
}

describe('duplicate release blocking scenarios', () => {
  it('never auto-stacks same-layout annual reports for different periods', () => {
    const body2024 = annualReportBody('31/12/2024', SYNTHETIC_EQUITY_2024);
    const body2025 = annualReportBody('31/12/2025', SYNTHETIC_EQUITY_2025);

    const decision = pairDecision(
      'DEMO-900042 - JA Auswertungen 2024.pdf',
      'JA Auswertungen 2024',
      body2024,
      'DEMO-900042 - JA Auswertungen 2025.pdf',
      'JA Auswertungen 2025',
      body2025,
      0.94
    );

    expect(decision.decision).not.toBe('auto_stack');
  });

  it('auto-stacks true re-uploads of the same annual report instance', () => {
    const body = annualReportBody('31/12/2025', SYNTHETIC_EQUITY_2025);

    const decision = pairDecision(
      'DEMO-900042 - JA Auswertungen 2025.pdf',
      'JA Auswertungen 2025',
      body,
      'DEMO-900042 - JA Auswertungen 2025 (1).pdf',
      'JA Auswertungen 2025',
      body,
      0.98
    );

    expect(decision.decision).toBe('auto_stack');
  });

  it('auto-stacks a second upload when OCR text is byte-identical', () => {
    const body = annualReportBody('31/12/2025', SYNTHETIC_EQUITY_2025);

    const decision = pairDecision(
      'upload-a.pdf',
      'upload a',
      body,
      'upload-b.pdf',
      'upload b',
      body,
      0.99
    );

    expect(decision.decision).toBe('auto_stack');
  });
});
