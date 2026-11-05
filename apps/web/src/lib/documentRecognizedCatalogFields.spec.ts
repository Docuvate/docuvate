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

  it('drops persisted catalog field when label gate is closed', () => {
    const merged = mergeCatalogFieldsForDocument(
      [{ key: 'global:bruttoentgelt', value: '1.234,56' }],
      [
        {
          id: 'f-brutto',
          key: 'global:bruttoentgelt',
          label: 'Bruttoentgelt',
          fieldType: 'currency',
          sortOrder: 0,
          extractForAllDocuments: false,
          gateLabelIds: ['tag-payroll'],
          gateLabelMatch: 'any',
          minLabelConfidence: 0.62,
          confidenceGateEnabled: true,
        },
      ],
      {
        assignedTagIds: [],
        assignedNonInboxTagIds: [],
        suggestions: [],
      },
      {
        fieldExtractionConfidenceGateEnabled: true,
        labelFieldConfidenceThreshold: 0.62,
        fieldExtractionRequiredLabelIds: [],
      }
    );
    expect(merged).toEqual([]);
  });
});

  it('does not add empty absender when global:vendor already fills that semantic slot', () => {
    const merged = mergeCatalogFieldsForDocument(
      [
        { key: 'amount', value: '12,00', userConfirmed: true },
        { key: 'global:vendor', value: 'Demo Absender GmbH', userConfirmed: true },
      ],
      [
        {
          id: 'f-datum',
          key: 'datum',
          label: 'Datum',
          fieldType: 'date',
          sortOrder: 0,
          extractForAllDocuments: true,
          gateLabelIds: [],
          gateLabelMatch: 'any',
          minLabelConfidence: null,
          confidenceGateEnabled: null,
          showInFilter: true,
        },
        {
          id: 'f-absender',
          key: 'absender',
          label: 'Absender',
          fieldType: 'text',
          sortOrder: 1,
          extractForAllDocuments: true,
          gateLabelIds: [],
          gateLabelMatch: 'any',
          minLabelConfidence: null,
          confidenceGateEnabled: null,
          showInFilter: true,
        },
      ],
      {
        assignedTagIds: [],
        assignedNonInboxTagIds: [],
        suggestions: [],
      },
      {
        fieldExtractionConfidenceGateEnabled: true,
        labelFieldConfidenceThreshold: 0.62,
        fieldExtractionRequiredLabelIds: [],
      }
    );
    const absenderLike = merged.filter(
      (row) => row.key === 'absender' || row.key === 'global:vendor' || row.key === 'vendor'
    );
    expect(absenderLike).toHaveLength(1);
    expect(absenderLike[0]?.key).toBe('global:vendor');
    expect(absenderLike[0]?.value).toBe('Demo Absender GmbH');
    expect(merged.some((row) => row.key === 'datum' && row.value === '')).toBe(true);
  });
