// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { mergeDocumentPlacementPatch, resolveDocumentPlacement } from './document-placement.js';

describe('document placement', () => {
  it('resolves folder-only placement', () => {
    expect(resolveDocumentPlacement({ folderId: 'f1' })).toEqual({ folderId: 'f1' });
    expect(resolveDocumentPlacement({})).toEqual({ folderId: null });
  });
});

describe('mergeDocumentPlacementPatch', () => {
  it('merges folder patch', () => {
    expect(
      mergeDocumentPlacementPatch({ folderId: null }, { folderId: 'f1' })
    ).toEqual({ folderId: 'f1' });
  });
});
