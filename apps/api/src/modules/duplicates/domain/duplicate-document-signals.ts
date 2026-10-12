// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface DuplicateEmbeddingPeerRow {
  documentId: string;
  embedding: number[];
  filename: string;
  title: string;
  documentDate: Date | null;
  extractedText: string | null;
  extractedFields: unknown;
}
