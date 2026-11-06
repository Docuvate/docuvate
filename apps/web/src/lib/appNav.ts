// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { routes } from './routes';

/** Top-level areas of the app: one per entry in the global header. */
export type AppSection = 'home' | 'documents' | 'labels' | 'fields' | 'folders' | 'settings';

interface PrimaryNavItem {
  section: AppSection;
  to: string;
  labelKey: string;
}

/** Global header order; settings sit with the account controls on the right. */
export const PRIMARY_NAV: readonly PrimaryNavItem[] = [
  { section: 'home', to: routes.home, labelKey: 'nav.home' },
  { section: 'documents', to: routes.documents, labelKey: 'nav.documents' },
  { section: 'labels', to: routes.structureLabels, labelKey: 'nav.labels' },
  { section: 'fields', to: routes.structureRecognizedFields, labelKey: 'nav.recognizedFields' },
  { section: 'folders', to: routes.filesystem, labelKey: 'nav.folders' },
];

/** Which header entry a path belongs to (null for pages outside the main areas, e.g. docs). */
export function appSectionOf(pathname: string): AppSection | null {
  if (pathname === routes.home) return 'home';
  if (
    pathname === routes.inbox ||
    pathname === routes.reviewQueue ||
    pathname === routes.documents ||
    pathname.startsWith(`${routes.documents}/`)
  ) {
    return 'documents';
  }
  if (pathname.startsWith(routes.structureLabels)) return 'labels';
  if (pathname.startsWith(routes.structureRecognizedFields)) return 'fields';
  if (pathname.startsWith(routes.filesystem)) return 'folders';
  if (pathname.startsWith(routes.settings)) return 'settings';
  return null;
}

/** Second-level entries of the documents area (the ribbon's "Bestand" group). */
export type DocumentsSubsection = 'all' | 'inbox' | 'review' | 'duplicates' | 'views';

export function documentsSubsectionOf(
  pathname: string,
  search: string
): DocumentsSubsection | null {
  if (pathname === routes.inbox) return 'inbox';
  if (pathname === routes.reviewQueue) return 'review';
  if (pathname === routes.duplicates) return 'duplicates';
  if (pathname === routes.savedViews) return 'views';
  if (pathname === routes.documents) {
    return new URLSearchParams(search).has('view') ? null : 'all';
  }
  return null;
}
