// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedFactKind } from '@docuvate/contracts';

export interface ExactFactRow {
  factId: string;
  documentId: string;
  documentTitle: string;
  kind: ExtractedFactKind;
  predicateKey: string;
  confidence: number;
  valueText: string | null;
  amountNumeric: number | null;
  currencyCode: string | null;
  valueDateIso: string | null;
  page: number | null;
  bboxX: number | null;
  bboxY: number | null;
  bboxWidth: number | null;
  bboxHeight: number | null;
  charStart: number | null;
  charEnd: number | null;
}
