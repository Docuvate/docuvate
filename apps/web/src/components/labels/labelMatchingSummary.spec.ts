// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import i18n from '../../i18n';
import { describeLabelAutoAssignment } from './labelMatchingSummary';

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
        i18n.t
      )
    ).toBe(i18n.t('labels.matchAny'));
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
        i18n.t
      )
    ).toBe(i18n.t('labels.assignInbox'));
  });
});
