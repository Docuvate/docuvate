// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface DocumentPlacement {
  folderId: string | null;
}

export function resolveDocumentPlacement(input: { folderId?: string | null }): DocumentPlacement {
  return { folderId: input.folderId ?? null };
}

export function mergeDocumentPlacementPatch(
  existing: DocumentPlacement,
  patch: { folderId?: string | null }
): DocumentPlacement {
  if (patch.folderId !== undefined) {
    return resolveDocumentPlacement({ folderId: patch.folderId });
  }
  return existing;
}
