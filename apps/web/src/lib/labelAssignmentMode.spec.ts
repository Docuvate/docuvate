// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import {
  applyLabelAssignmentMode,
  labelAssignmentModeNeedsMatchText,
  readLabelAssignmentMode,
} from './labelAssignmentMode';

describe('labelAssignmentMode', () => {
  it('maps inbox tag to inbox mode', () => {
    expect(readLabelAssignmentMode({ isInbox: true, matchingAlgorithm: 'none' })).toBe('inbox');
  });

  it('maps text rules to modes', () => {
    expect(readLabelAssignmentMode({ isInbox: false, matchingAlgorithm: 'any' })).toBe('any');
  });

  it('maps none to recommend default', () => {
    expect(readLabelAssignmentMode({ isInbox: false, matchingAlgorithm: 'none' })).toBe(
      'recommend'
    );
  });

  it('apply inbox clears match text', () => {
    const next = applyLabelAssignmentMode('inbox', {
      name: 'x',
      color: '#333',
      isInbox: false,
      matchingAlgorithm: 'any',
      match: 'foo',
    });
    expect(next.isInbox).toBe(true);
    expect(next.matchingAlgorithm).toBe('none');
    expect(next.match).toBe('');
  });

  it('match text only for word/pattern modes', () => {
    expect(labelAssignmentModeNeedsMatchText('any')).toBe(true);
    expect(labelAssignmentModeNeedsMatchText('recommend')).toBe(false);
  });
});
