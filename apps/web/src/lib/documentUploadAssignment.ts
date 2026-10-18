// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery, FolderDto } from '@docuvate/contracts';

import i18n from '../i18n';
import { updateDocument } from './api';

export type DocumentUploadAssignment =
  | { kind: 'inbox' }
  | { kind: 'folder'; folderId: string; label: string };

export interface LibraryDropTarget {
  enabled: boolean;
  assignment: DocumentUploadAssignment;
  overlayTitle: string;
  overlayHint: string;
}

export function resolveLibraryDropTarget(input: {
  mode: 'all' | 'folder';
  folderId?: string;
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
  browseMode: 'root' | 'folder' | 'unassigned';
  folderId?: string;
  folders: FolderDto[];
  assignmentOverride?: DocumentUploadAssignment | null;
}): LibraryDropTarget {
  if (input.assignmentOverride?.kind === 'folder') {
    return folderUploadTarget(
      input.assignmentOverride.folderId,
      input.folders,
      input.assignmentOverride.label
    );
  }

  if (input.browseMode === 'folder' && input.folderId) {
    return folderUploadTarget(input.folderId, input.folders);
  }

  if (input.browseMode === 'unassigned') {
    return disabledLibraryDropTarget();
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
    default: {
      const _exhaustive: never = assignment;
      return _exhaustive;
    }
  }
}
