// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { mergeDocumentPlacementPatch, resolveDocumentPlacement } from './document-placement.js';

describe('resolveDocumentPlacement', () => {
  it('allows direct mappe placement without folder', () => {
    expect(resolveDocumentPlacement({ mappeId: 'm1', folderId: null })).toEqual({
      folderId: null,
      mappeId: 'm1',
    });
  });

  it('rejects folder and mappe together', () => {
    expect(() => resolveDocumentPlacement({ folderId: 'f1', mappeId: 'm1' })).toThrow(
      /folder and a mappe/
    );
  });
});

describe('mergeDocumentPlacementPatch', () => {
  it('clears mappe when assigning folder', () => {
    expect(
      mergeDocumentPlacementPatch({ folderId: null, mappeId: 'm1' }, { folderId: 'f1' })
    ).toEqual({ folderId: 'f1', mappeId: null });
  });

  it('clears folder when assigning mappe', () => {
    expect(
      mergeDocumentPlacementPatch({ folderId: 'f1', mappeId: null }, { mappeId: 'm1' })
    ).toEqual({ folderId: null, mappeId: 'm1' });
  });
});
