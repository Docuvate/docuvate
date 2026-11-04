// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** A user folder in the document tree. */
export interface FolderEntity {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
