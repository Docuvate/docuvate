import type { DocumentDto } from '@docuvate/contracts';

type Translate = (key: 'library.stackVersionBadge', options: { count: number }) => string;

export function duplicateStackVersionLabel(doc: DocumentDto, t: Translate): string | null {
  const count = doc.duplicateStack?.versionCount ?? 0;
  if (count < 2) {
    return null;
  }
  return t('library.stackVersionBadge', { count });
}

export function showDuplicateStackBadge(doc: DocumentDto): boolean {
  return (doc.duplicateStack?.versionCount ?? 0) >= 2;
}

export function showLegacyDuplicateHint(doc: DocumentDto): boolean {
  if (showDuplicateStackBadge(doc)) {
    return false;
  }
  return (doc.duplicateCandidateCount ?? 0) > 0;
}
