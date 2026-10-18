// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { minimalDocumentDto } from '../../test-utils/minimalDocumentDto';
import { duplicateStackVersionLabel, showDuplicateStackBadge } from './duplicateStackLabel';

function docWithVersions(count: number): DocumentDto {
  return minimalDocumentDto({
    id: 'd1',
    duplicateStack: count > 0 ? { versionCount: count, pendingReview: false } : null,
  });
}

describe('duplicateStackLabel', () => {
  const t = (key: string, opts?: { count?: number }) => {
    if (key === 'library.stackVersionBadge') return `${String(opts?.count)} Versionen`;
    if (key === 'library.duplicateHintBadge') return 'Duplikat?';
    return key;
  };

  it('shows badge from a single stacked version upward', () => {
    expect(showDuplicateStackBadge(docWithVersions(0))).toBe(false);
    expect(showDuplicateStackBadge(docWithVersions(1))).toBe(true);
    expect(showDuplicateStackBadge(docWithVersions(2))).toBe(true);
    expect(duplicateStackVersionLabel(docWithVersions(1), t)).toBe('Duplikat?');
    expect(duplicateStackVersionLabel(docWithVersions(2), t)).toBe('2 Versionen');
  });
});
