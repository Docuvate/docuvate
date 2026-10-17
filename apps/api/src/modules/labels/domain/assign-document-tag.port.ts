// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface AssignDocumentTag {
  execute(
    documentId: string,
    userId: string,
    tagId: string,
    options?: { learnFromEmbedding?: boolean }
  ): Promise<void>;
}
