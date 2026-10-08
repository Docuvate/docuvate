import type { DocumentListQuery, FolderDto, MappeDto } from '@docuvate/contracts';
import i18n from '../i18n';
import { updateDocument } from './api';

export type DocumentUploadAssignment =
  | { kind: 'inbox' }
  | { kind: 'folder'; folderId: string; label: string }
  | { kind: 'mappe'; mappeId: string; label: string };

export interface LibraryDropTarget {
  enabled: boolean;
  assignment: DocumentUploadAssignment;
  overlayTitle: string;
  overlayHint: string;
}

export function resolveLibraryDropTarget(input: {
  mode: 'all' | 'folder' | 'mappe';
  folderId?: string;
  mappeId?: string;
  filters: DocumentListQuery;
  folders: FolderDto[];
}): LibraryDropTarget {
  const tagIds = input.filters.tagIds ?? (input.filters.tagId ? [input.filters.tagId] : []);
  if (tagIds.length > 0) {
    return disabledTarget();
  }

  if (input.mode === 'folder' && input.folderId) {
    const folder = input.folders.find((f) => f.id === input.folderId);
    const label = folder?.name ?? i18n.t('common.folder');
    return {
      enabled: true,
      assignment: { kind: 'folder', folderId: input.folderId, label },
      overlayTitle: i18n.t('upload.overlayDropInFolder'),
      overlayHint: i18n.t('upload.overlayDropInFolderHint', { label }),
    };
  }

  if (input.mode === 'mappe' && input.mappeId) {
    const inMappe = input.folders.filter((f) => f.mappeId === input.mappeId);
    if (inMappe.length !== 1) {
      return disabledTarget();
    }
    const folder = inMappe[0]!;
    return {
      enabled: true,
      assignment: { kind: 'folder', folderId: folder.id, label: folder.name },
      overlayTitle: i18n.t('upload.overlayDropInFolder'),
      overlayHint: i18n.t('upload.overlayDropInFolderHintNamed', { label: folder.name }),
    };
  }

  if (input.mode === 'all') {
    return {
      enabled: true,
      assignment: { kind: 'inbox' },
      overlayTitle: i18n.t('upload.overlayDropDocuments'),
      overlayHint: i18n.t('upload.overlayInboxHint'),
    };
  }

  return disabledTarget();
}

export function disabledLibraryDropTarget(): LibraryDropTarget {
  return {
    enabled: false,
    assignment: { kind: 'inbox' },
    overlayTitle: '',
    overlayHint: '',
  };
}

function folderUploadTarget(
  folderId: string,
  folders: FolderDto[],
  labelOverride?: string
): LibraryDropTarget {
  const folder = folders.find((f) => f.id === folderId);
  const label = labelOverride ?? folder?.name ?? i18n.t('common.folder');
  return {
    enabled: true,
    assignment: { kind: 'folder', folderId, label },
    overlayTitle: i18n.t('upload.overlayDropInFolder'),
    overlayHint: i18n.t('upload.overlayDropInFolderHintNamed', { label }),
  };
}

/** Drop/upload target for the filesystem explorer (ignores label filters). */
export function resolveFilesystemDropTarget(input: {
  browseMode: 'root' | 'mappe' | 'folder';
  folderId?: string;
  mappeId?: string;
  folders: FolderDto[];
  mappen?: MappeDto[];
  assignmentOverride?: DocumentUploadAssignment | null;
}): LibraryDropTarget {
  if (input.assignmentOverride && input.assignmentOverride.kind === 'folder') {
    return folderUploadTarget(
      input.assignmentOverride.folderId,
      input.folders,
      input.assignmentOverride.label
    );
  }

  if (input.browseMode === 'folder' && input.folderId) {
    return folderUploadTarget(input.folderId, input.folders);
  }

  if (input.browseMode === 'mappe' && input.mappeId) {
    const mappe = input.mappen?.find((m) => m.id === input.mappeId);
    const label = mappe?.name ?? i18n.t('common.folder');
    return {
      enabled: true,
      assignment: { kind: 'mappe', mappeId: input.mappeId, label },
      overlayTitle: i18n.t('upload.overlayDropInFolder'),
      overlayHint: i18n.t('upload.overlayDropInFolderHintNamed', { label }),
    };
  }

  return disabledLibraryDropTarget();
}

function disabledTarget(): LibraryDropTarget {
  return disabledLibraryDropTarget();
}

export async function applyDocumentUploadAssignment(
  documentId: string,
  assignment: DocumentUploadAssignment
): Promise<void> {
  switch (assignment.kind) {
    case 'inbox':
      return;
    case 'folder':
      await updateDocument(documentId, { folderId: assignment.folderId });
      return;
    case 'mappe':
      await updateDocument(documentId, { mappeId: assignment.mappeId, folderId: null });
      return;
    default: {
      const _exhaustive: never = assignment;
      return _exhaustive;
    }
  }
}
