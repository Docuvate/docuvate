// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  duplicateStackVersionLabel,
  showDuplicateStackBadge,
} from '../components/library/duplicateStackLabel';
import { minimalDocumentDto } from '../test-utils/minimalDocumentDto';

function docWithVersions(count: number): DocumentDto {
  return minimalDocumentDto({
    id: '1',
    filename: 'x.pdf',
    title: 'X',
    duplicateStack: count > 0 ? { versionCount: count, pendingReview: false } : null,
  });
}

const t = (_key: 'library.stackVersionBadge', { count }: { count: number }) => `${String(count)} Versionen`;

describe('duplicateStackVersionLabel', () => {
  it('shows duplicate hint label for a single stacked version', () => {
    const hintT = (key: 'library.stackVersionBadge' | 'library.duplicateHintBadge') =>
      key === 'library.duplicateHintBadge' ? 'Duplikat?' : '';
    expect(duplicateStackVersionLabel(docWithVersions(1), hintT)).toBe('Duplikat?');
    expect(showDuplicateStackBadge(docWithVersions(1))).toBe(true);
  });

  it('shows label from two versions upward', () => {
    expect(duplicateStackVersionLabel(docWithVersions(2), t)).toBe('2 Versionen');
    expect(showDuplicateStackBadge(docWithVersions(2))).toBe(true);
  });
});
