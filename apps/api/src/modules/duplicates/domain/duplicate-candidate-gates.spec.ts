// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  collectReportingYears,
  evaluateEmbeddingDuplicateCandidate,
  reportingYearsConflict,
  type DuplicateDocumentSignals,
} from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import type { DuplicateDetectionConfig } from './duplicate-detection.config.js';

const defaultConfig: Pick<
  DuplicateDetectionConfig,
  'pageCountMinDifference' | 'pageCountGateMaxSimilarity'
> = {
  pageCountMinDifference: 3,
  pageCountGateMaxSimilarity: 0.95,
};

function signals(
  partial: Partial<DuplicateDocumentSignals> & Pick<DuplicateDocumentSignals, 'documentId'>
): DuplicateDocumentSignals {
  return {
    filename: '',
    title: '',
    documentDateYear: null,
    extractedTextSample: '',
    pageCount: null,
    ...partial,
  };
}

describe('collectReportingYears', () => {
  it('reads years from German annual report filenames and OCR snippets', () => {
    const years = collectReportingYears(
      signals({
        documentId: 'a',
        filename: '774128 - JA Auswertungen 2025.pdf',
        extractedTextSample: 'JAHRESABSCHLUSS zum 31. Dezember 2025',
      })
    );
    expect(years).toContain(2025);
  });

  it('ignores upload document date when filename carries the fiscal year', () => {
    const years = collectReportingYears(
      signals({
        documentId: 'a',
        filename: '774128 - JA Auswertungen 2025.pdf',
        documentDateYear: 2026,
      })
    );
    expect(years).toEqual([2025]);
  });

  it('reads December closing dates from Bilanz text', () => {
    const years = collectReportingYears(
      signals({
        documentId: 'b',
        filename: '655536 - JA Auswertungen HR 2024.pdf',
        extractedTextSample: 'Bilanz zum 31.12.2024',
      })
    );
    expect(years).toContain(2024);
  });
});

describe('reportingYearsConflict', () => {
  it('detects disjoint reporting years', () => {
    expect(reportingYearsConflict([2025], [2024])).toBe(true);
  });

  it('does not conflict when years overlap', () => {
    expect(reportingYearsConflict([2024, 2025], [2025])).toBe(false);
  });

  it('does not conflict when one side lacks year signal', () => {
    expect(reportingYearsConflict([2025], [])).toBe(false);
  });
});

describe('evaluateEmbeddingDuplicateCandidate', () => {
  it('rejects same-company annual reports for different fiscal years (screenshot case)', () => {
    const source = signals({
      documentId: 'left',
      filename: '774128 - JA Auswertungen 2025.pdf',
      title: 'JA Auswertungen 2025',
      documentDateYear: 2026,
      extractedTextSample: 'JAHRESABSCHLUSS zum 31. Dezember 2025\nEHW+ Services GmbH',
      pageCount: 12,
    });
    const candidate = signals({
      documentId: 'right',
      filename: '655536 - JA Auswertungen HR 2024.pdf',
      title: 'JA Auswertungen HR 2024',
      documentDateYear: 2026,
      extractedTextSample: 'Bilanz zum 31.12.2024\nEHW+ Services GmbH Appentwicklung',
      pageCount: 11,
    });

    const result = evaluateEmbeddingDuplicateCandidate(source, candidate, 0.88, defaultConfig);
    expect(result.accept).toBe(false);
    expect(result.reason).toBe('conflicting_reporting_years');
  });

  it('rejects income tax assessments for different years with different amounts', () => {
    const source = signals({
      documentId: 'a',
      filename: 'Einkommensteuerbescheid 2023.pdf',
      extractedTextSample: 'Festgesetzt: 4.821,00 EUR\nVeranlagungszeitraum 2023',
    });
    const candidate = signals({
      documentId: 'b',
      filename: 'Einkommensteuerbescheid 2024.pdf',
      extractedTextSample: 'Festgesetzt: 5.104,50 EUR\nVeranlagungszeitraum 2024',
    });
    expect(
      evaluateEmbeddingDuplicateCandidate(source, candidate, 0.96, defaultConfig).accept
    ).toBe(false);
  });

  it('allows near-duplicate uploads with matching years and similar length', () => {
    const source = signals({
      documentId: 'a',
      filename: 'Rechnung-2024-final.pdf',
      extractedTextSample: 'Rechnung 2024 Kestrel Auto 199,00 EUR',
      pageCount: 2,
    });
    const candidate = signals({
      documentId: 'b',
      filename: 'Rechnung-2024-final (1).pdf',
      extractedTextSample: 'Rechnung 2024 Kestrel Auto 199,00 EUR',
      pageCount: 2,
    });

    expect(evaluateEmbeddingDuplicateCandidate(source, candidate, 0.91, defaultConfig).accept).toBe(
      true
    );
  });

  it('allows scan vs original for the same tax year when amounts match', () => {
    const source = signals({
      documentId: 'a',
      filename: 'Bescheid-2024-scan.pdf',
      extractedTextSample: 'Einkommensteuer 2024 Festgesetzt: 1.200,00 EUR',
      pageCount: 8,
    });
    const candidate = signals({
      documentId: 'b',
      filename: 'Bescheid-2024.pdf',
      extractedTextSample: 'Einkommensteuer 2024 Festgesetzt: 1.200,00 EUR',
      pageCount: 4,
    });
    expect(evaluateEmbeddingDuplicateCandidate(source, candidate, 0.97, defaultConfig).accept).toBe(
      true
    );
  });

  it('rejects embedding match when page counts differ strongly at moderate similarity', () => {
    const source = signals({
      documentId: 'a',
      filename: 'Vertrag.pdf',
      pageCount: 12,
    });
    const candidate = signals({
      documentId: 'b',
      filename: 'Vertrag-scan.pdf',
      pageCount: 8,
    });

    const result = evaluateEmbeddingDuplicateCandidate(source, candidate, 0.9, defaultConfig);
    expect(result.accept).toBe(false);
    expect(result.reason).toBe('page_count_mismatch');
  });

  it('allows large page-count gap when similarity is very high', () => {
    const source = signals({ documentId: 'a', filename: 'scan-a.pdf', pageCount: 10 });
    const candidate = signals({ documentId: 'b', filename: 'scan-b.pdf', pageCount: 6 });

    expect(evaluateEmbeddingDuplicateCandidate(source, candidate, 0.97, defaultConfig).accept).toBe(
      true
    );
  });
});
