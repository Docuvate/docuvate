// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { FieldSuggestionRejectRecord } from '../../../shared/domain/ports.js';
import { withdrawSuggestionRejectsForValue } from './withdraw-suggestion-reject.js';

const legacy: FieldSuggestionRejectRecord = {
  id: 'decision-1',
  correctionId: 'correction-1',
  fieldKey: 'global:vendor',
  value: 'ACME GmbH',
  valueNormalized: 'acme gmbh',
  createdAt: '2026-11-07T00:00:00.000Z',
};

describe('withdrawSuggestionRejectsForValue', () => {
  it('withdraws the legacy global: decision when the review row is accepted', async () => {
    const withdrawn: string[] = [];
    const regions = {
      findActiveFieldSuggestionReject(
        _documentId: string,
        fieldKey: string,
        valueNormalized: string
      ): Promise<FieldSuggestionRejectRecord | null> {
        if (fieldKey === 'global:vendor' && valueNormalized === 'acme gmbh') {
          return Promise.resolve(legacy);
        }
        return Promise.resolve(null);
      },
      withdrawFieldCorrection(_documentId: string, correctionId: string): Promise<boolean> {
        withdrawn.push(correctionId);
        return Promise.resolve(true);
      },
    };
    const result = await withdrawSuggestionRejectsForValue(regions, 'doc-1', 'vendor', '  ACME   GmbH ');
    expect(withdrawn).toEqual(['correction-1']);
    expect(result).toEqual([legacy]);
  });

  it('leaves a different field with the same text rejected', async () => {
    const withdrawn: string[] = [];
    const regions = {
      findActiveFieldSuggestionReject(
        _documentId: string,
        fieldKey: string,
        valueNormalized: string
      ): Promise<FieldSuggestionRejectRecord | null> {
        if (fieldKey === 'absender' && valueNormalized === 'acme gmbh') {
          return Promise.resolve({
            ...legacy,
            id: 'decision-2',
            correctionId: 'correction-2',
            fieldKey: 'absender',
          });
        }
        return Promise.resolve(null);
      },
      withdrawFieldCorrection(_documentId: string, correctionId: string): Promise<boolean> {
        withdrawn.push(correctionId);
        return Promise.resolve(true);
      },
    };
    const result = await withdrawSuggestionRejectsForValue(regions, 'doc-1', 'vendor', 'ACME GmbH');
    expect(withdrawn).toEqual([]);
    expect(result).toEqual([]);
  });
});
