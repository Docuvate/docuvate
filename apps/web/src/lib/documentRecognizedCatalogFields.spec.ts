// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { mergeCatalogFieldsForDocument } from './documentRecognizedCatalogFields';

describe('mergeCatalogFieldsForDocument', () => {
  it('adds empty gated field row when label gate is open', () => {
    const merged = mergeCatalogFieldsForDocument(
      [],
      [
        {
          id: 'f1',
          key: 'global:monat',
          label: 'Monat',
          fieldType: 'text',
          sortOrder: 0,
          extractForAllDocuments: false,
          gateLabelIds: ['tag-payroll'],
          gateLabelMatch: 'any',
          minLabelConfidence: 0.5,
          confidenceGateEnabled: true,
        },
      ],
      {
        assignedTagIds: ['tag-payroll'],
        assignedNonInboxTagIds: ['tag-payroll'],
        suggestions: [],
      },
      {
        fieldExtractionConfidenceGateEnabled: true,
        labelFieldConfidenceThreshold: 0.72,
        fieldExtractionRequiredLabelIds: [],
      }
    );
    expect(merged).toEqual([{ key: 'global:monat', value: '' }]);
  });
});
