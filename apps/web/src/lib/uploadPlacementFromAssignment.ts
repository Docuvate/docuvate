// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentUploadAssignment } from './documentUploadAssignment';

export interface UploadPlacementQuery {
  folderId?: string;
}

/** Query params for POST /documents when assignment targets a folder. */
export function uploadPlacementFromAssignment(
  assignment: DocumentUploadAssignment
): UploadPlacementQuery | undefined {
  switch (assignment.kind) {
    case 'folder':
      return { folderId: assignment.folderId };
    case 'inbox':
      return undefined;
    default: {
      const _exhaustive: never = assignment;
      return _exhaustive;
    }
  }
}
