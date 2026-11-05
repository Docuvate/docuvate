// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  activeLibraryStageTab,
  LIBRARY_STAGE_TABS,
  libraryStageTabCount,
  libraryStageTabPatch,
} from './libraryStageTabs';

describe('libraryStageTabs', () => {
  it('round-trips every tab through its filter patch', () => {
    for (const tab of LIBRARY_STAGE_TABS) {
      expect(activeLibraryStageTab(libraryStageTabPatch(tab))).toBe(tab);
    }
  });

  it('clears the other stage filters when switching', () => {
    expect(libraryStageTabPatch('failed')).toEqual({
      inbox: undefined,
      withoutNonInboxLabel: undefined,
      status: 'failed',
    });
  });

  it('selects no tab for combinations it cannot express', () => {
    expect(activeLibraryStageTab({ status: 'queued' })).toBeNull();
    expect(activeLibraryStageTab({ inbox: true, status: 'ready' })).toBeNull();
    expect(activeLibraryStageTab({ inbox: true, withoutNonInboxLabel: true })).toBeNull();
  });

  it('only shows exact counts', () => {
    const overview = {
      waiting: 2,
      structuring: 1,
      failed: 1,
      review: 3,
      unlabeled: 4,
      ready: 8,
      total: 12,
    };
    expect(libraryStageTabCount('all', overview)).toBe(12);
    expect(libraryStageTabCount('review', overview)).toBeNull();
    expect(libraryStageTabCount('unlabeled', overview)).toBe(4);
    expect(libraryStageTabCount('failed', null)).toBeNull();
  });
});
