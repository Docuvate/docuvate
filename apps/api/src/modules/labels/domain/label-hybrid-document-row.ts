// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** One labelled document used to train the hybrid label model. */
export interface LabelHybridDocumentRow {
  documentId: string;
  embedding: number[];
  nonInboxTagIds: string[];
  text: string;
}
