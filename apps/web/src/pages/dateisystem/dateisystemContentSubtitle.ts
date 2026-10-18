// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';

import i18n from '../../i18n';
import { findFolder, type OrdnerSelection } from '../../lib/ordnerTree';

export function dateisystemContentSubtitle(
  selection: OrdnerSelection,
  folders: FolderDto[],
  activeLabelNames: readonly string[],
  browseMode: 'root' | 'folder' | 'unassigned'
): string | null {
  if (activeLabelNames.length > 0) {
    return i18n.t('library.labelFilter', { labels: activeLabelNames.join(' + ') });
  }
  if (browseMode === 'root') {
    return null;
  }
  if (selection.kind === 'unassigned') {
    return i18n.t('filesystem.unassignedHint');
  }
  if (selection.kind === 'folder') {
    const f = findFolder(folders, selection.folderId);
    return f ? i18n.t('filesystem.folderNamed', { name: f.name }) : null;
  }
  return null;
}
