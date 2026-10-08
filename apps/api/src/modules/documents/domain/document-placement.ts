import { ValidationError } from '../../../shared/domain/errors.js';

export interface DocumentPlacement {
  folderId: string | null;
  mappeId: string | null;
}

/** Folder and direct mappe placement are mutually exclusive. */
export function resolveDocumentPlacement(input: {
  folderId?: string | null;
  mappeId?: string | null;
}): DocumentPlacement {
  const folderId = input.folderId ?? null;
  const mappeId = input.mappeId ?? null;
  if (folderId != null && mappeId != null) {
    throw new ValidationError('Document cannot belong to a folder and a mappe at the same time');
  }
  return { folderId, mappeId };
}

export function mergeDocumentPlacementPatch(
  existing: DocumentPlacement,
  patch: { folderId?: string | null; mappeId?: string | null }
): DocumentPlacement {
  let folderId = existing.folderId;
  let mappeId = existing.mappeId;

  if (patch.folderId !== undefined) {
    folderId = patch.folderId;
    if (patch.folderId != null) {
      mappeId = null;
    }
  }
  if (patch.mappeId !== undefined) {
    mappeId = patch.mappeId;
    if (patch.mappeId != null) {
      folderId = null;
    }
  }

  return resolveDocumentPlacement({ folderId, mappeId });
}
