// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** A retrieved chunk with its hybrid-search fusion score. */
export interface CitedChatChunkCandidate {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  body: string;
  page: number | null;
  charStart: number | null;
  charEnd: number | null;
  fusionScore: number;
}
