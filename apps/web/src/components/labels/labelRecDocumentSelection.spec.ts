// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  allDocumentsSelected,
  excludedDocumentIds,
  initialSelectedDocumentIds,
  selectedDocumentIds,
} from './labelRecDocumentSelection';

describe('labelRecDocumentSelection', () => {
  const docs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('starts with all documents selected', () => {
    const selected = initialSelectedDocumentIds(docs);
    expect(allDocumentsSelected(selected, docs)).toBe(true);
  });

  it('computes excluded and selected ids', () => {
    const selected = new Set(['a', 'c']);
    expect(selectedDocumentIds(docs, selected)).toEqual(['a', 'c']);
    expect(excludedDocumentIds(docs, selected)).toEqual(['b']);
  });
});
