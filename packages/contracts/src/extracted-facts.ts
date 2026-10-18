// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ExtractedFactKind = 'key_value' | 'amount' | 'date' | 'table_cell';

export interface ExtractedFactProvenanceDto {
  page: number | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  charStart: number | null;
  charEnd: number | null;
}

export interface ExtractedFactDto {
  kind: ExtractedFactKind;
  predicateKey: string;
  confidence: number;
  provenance: ExtractedFactProvenanceDto;
  valueText?: string | null;
  amountNumeric?: number | null;
  currencyCode?: string | null;
  valueDateIso?: string | null;
  tableIndex?: number | null;
  rowIndex?: number | null;
  colIndex?: number | null;
}
