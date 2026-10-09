// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { describeLabelAutoAssignment } from './labelMatchingSummary';

const t = ((key: string) => key) as TFunction;

describe('describeLabelAutoAssignment', () => {
  it('uses assignment mode label keys', () => {
    expect(
      describeLabelAutoAssignment(
        {
          id: '1',
          name: 'Rechnung',
          color: '#333',
          isInbox: false,
          matchingAlgorithm: 'any',
          match: 'Strom',
        },
        t
      )
    ).toBe('labels.matchAny');
  });

  it('maps inbox to assignInbox key', () => {
    expect(
      describeLabelAutoAssignment(
        {
          id: '1',
          name: 'Inbox',
          color: '#333',
          isInbox: true,
          matchingAlgorithm: 'none',
          match: '',
        },
        t
      )
    ).toBe('labels.assignInbox');
  });
});
