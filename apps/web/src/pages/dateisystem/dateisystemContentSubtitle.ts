import type { FolderDto, MappeDto } from '@docuvate/contracts';
import i18n from '../../i18n';
import { findFolder, findMappe, type OrdnerSelection } from '../../lib/ordnerTree';

export function dateisystemContentSubtitle(
  selection: OrdnerSelection,
  mappen: MappeDto[],
  folders: FolderDto[],
  mappeSubtitle: string | null,
  activeLabelNames: readonly string[],
  browseMode: 'root' | 'mappe' | 'folder'
): string | null {
  if (activeLabelNames.length > 0) {
    return i18n.t('library.labelFilter', { labels: activeLabelNames.join(' + ') });
  }
  if (browseMode === 'root') {
    return null;
  }
  if (selection.kind === 'mappe') {
    return mappeSubtitle;
  }
  if (selection.kind === 'folder') {
    const f = findFolder(folders, selection.folderId);
    const mappe = f?.mappeId ? findMappe(mappen, f.mappeId) : undefined;
    if (mappe && f) {
      return i18n.t('filesystem.folderInMappeHint', { mappe: mappe.name });
    }
    return f ? i18n.t('filesystem.folderNamed', { name: f.name }) : null;
  }
  return null;
}
