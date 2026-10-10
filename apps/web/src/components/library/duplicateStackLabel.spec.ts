// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { duplicateStackVersionLabel, showDuplicateStackBadge } from './duplicateStackLabel';

function docWithVersions(count: number): DocumentDto {
  return {
    id: 'd1',
    duplicateStack: { versionCount: count, pendingReview: false },
  } as DocumentDto;
}

describe('duplicateStackLabel', () => {
  const t = (key: string, opts?: { count?: number }) =>
    key === 'library.stackVersionBadge' ? `${String(opts?.count)} Versionen` : key;

  it('shows badge only from two versions', () => {
    expect(showDuplicateStackBadge(docWithVersions(0))).toBe(false);
    expect(showDuplicateStackBadge(docWithVersions(1))).toBe(false);
    expect(showDuplicateStackBadge(docWithVersions(2))).toBe(true);
    expect(duplicateStackVersionLabel(docWithVersions(1), t)).toBeNull();
    expect(duplicateStackVersionLabel(docWithVersions(2), t)).toBe('2 Versionen');
  });
});
