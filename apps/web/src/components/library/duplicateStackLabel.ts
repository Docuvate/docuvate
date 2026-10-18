// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

type Translate = (
  key: 'library.stackVersionBadge' | 'library.duplicateHintBadge',
  options?: { count: number }
) => string;

export function duplicateStackVersionLabel(doc: DocumentDto, t: Translate): string | null {
  const count = doc.duplicateStack?.versionCount ?? 0;
  if (count < 1) {
    return null;
  }
  if (count === 1) {
    return t('library.duplicateHintBadge');
  }
  return t('library.stackVersionBadge', { count });
}

export function showDuplicateStackBadge(doc: DocumentDto): boolean {
  return (doc.duplicateStack?.versionCount ?? 0) >= 1;
}

export function showLegacyDuplicateHint(doc: DocumentDto): boolean {
  if (showDuplicateStackBadge(doc)) {
    return false;
  }
  return (doc.duplicateCandidateCount ?? 0) > 0;
}
