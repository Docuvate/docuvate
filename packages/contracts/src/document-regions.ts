// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { LayoutToken, NormalizedRect } from './region-geometry.js';
import type { TableRowRole, TableRuleLine } from './table-structure.js';

export type DocumentRegionShape = 'rect' | 'polygon';
export type DocumentRegionRole = 'field' | 'table' | 'block' | 'ignore';
export type DocumentCorrectionKind = 'label' | 'field' | 'table' | 'block' | 'page';
export type DocumentCorrectionStatus = 'active' | 'withdrawn';
export type FieldCorrectionOp = 'create' | 'reanchor' | 'edit_value' | 'remove' | 'reject_suggestion';
export type FieldCorrectionScope = 'document' | 'label' | 'always';
export type TableCorrectionOp = 'create' | 'set_headers' | 'edit_cell' | 'remove';
export type DocumentRegionTableType = 'line_items' | 'key_value' | 'other';

export type LayoutTokenDto = LayoutToken;

export interface DocumentLayoutTokensResponse {
  page: number | null;
  irSha256: string;
  tokens: LayoutTokenDto[];
}

export interface DocumentRegionFieldDto {
  fieldKey: string;
  valueOverride: string | null;
}

export interface DocumentRegionTableRuleDto {
  axis: 'row' | 'col';
  ord: number;
  pos: number;
  /** Appearance evidence only; `unknown` until a line is observed or set by a person. */
  line: TableRuleLine;
}

export interface DocumentRegionTableRuleLineDto {
  axis: 'row' | 'col';
  ord: number;
  line: TableRuleLine;
}

export interface DocumentRegionTableRowRoleDto {
  row: number;
  role: TableRowRole;
}

export interface DocumentRegionTableMergeDto {
  row0: number;
  col0: number;
  rowSpan: number;
  colSpan: number;
}

export interface DocumentRegionTableCellDto {
  row: number;
  col: number;
  text: string;
}

export interface DocumentRegionTableDto {
  tableType: DocumentRegionTableType;
  /** Header rows; more than one is a nested header (spans come from `merges`). */
  headerRows: number;
  /** Trailing summary rows (results/accounting footer). */
  footerRows: number;
  /** Leading index columns (left index). */
  headerCols: number;
  /** Trailing index columns (right index; with `headerCols` a double index). */
  trailingHeaderCols: number;
  /** Alternating row tint; appearance only. */
  banded: boolean;
  /** Section headings and subtotals inside the body; other body rows are data rows. */
  rowRoles: DocumentRegionTableRowRoleDto[];
  rules: DocumentRegionTableRuleDto[];
  merges: DocumentRegionTableMergeDto[];
  cells: DocumentRegionTableCellDto[];
}

export interface DocumentRegionDto {
  id: string;
  documentId: string;
  page: number;
  shape: DocumentRegionShape;
  role: DocumentRegionRole;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  irSha256: string;
  needsReview: boolean;
  blockIndexes: number[];
  field?: DocumentRegionFieldDto;
  table?: DocumentRegionTableDto;
  createdAt: string;
}

export interface DocumentRegionListResponse {
  irSha256: string | null;
  items: DocumentRegionDto[];
}

export interface ApplyFieldCorrectionRequest {
  id: string;
  op: FieldCorrectionOp;
  fieldKey: string;
  page?: number;
  shape?: DocumentRegionShape;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  blockIndexes?: number[];
  valueOverride?: string | null;
  scope?: FieldCorrectionScope;
  tagId?: string | null;
  beforeRegionId?: string | null;
}

export interface DocumentCorrectionDto {
  id: string;
  documentId: string;
  kind: DocumentCorrectionKind;
  status: DocumentCorrectionStatus;
  op: FieldCorrectionOp | TableCorrectionOp;
  fieldKey: string;
  beforeRegionId: string | null;
  afterRegionId: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}


/** Normalize a suggested/extracted value for durable reject identity (field + value). */
export function normalizeSuggestionDecisionValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

export type FieldSuggestionDecisionKind = 'rejected';

export interface FieldSuggestionDecisionDto {
  id: string;
  correctionId: string;
  fieldKey: string;
  value: string;
  valueNormalized: string;
  decision: FieldSuggestionDecisionKind;
  createdAt: string;
}

export interface FieldSuggestionDecisionsResponse {
  items: FieldSuggestionDecisionDto[];
}

export interface ApplyFieldCorrectionResponse {
  noChange: boolean;
  correction: DocumentCorrectionDto | null;
  region: DocumentRegionDto | null;
}

export interface ApplyTableCorrectionRequest {
  id: string;
  op: TableCorrectionOp;
  page?: number;
  shape?: DocumentRegionShape;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  blockIndexes?: number[];
  beforeRegionId?: string | null;
  tableType?: DocumentRegionTableType;
  headerRows?: number;
  headerCols?: number;
  footerRows?: number;
  trailingHeaderCols?: number;
  banded?: boolean;
  /** Replaces all row roles on `create` and `set_headers`. */
  rowRoles?: DocumentRegionTableRowRoleDto[];
  /** Line evidence for the listed rules on `create` and `set_headers`; other rules keep theirs. */
  ruleLines?: DocumentRegionTableRuleLineDto[];
  /** Merged cells (rowSpan/colSpan); replaces all merges on `create` and `set_headers`. */
  merges?: DocumentRegionTableMergeDto[];
  cell?: DocumentRegionTableCellDto;
}

export interface ApplyTableCorrectionResponse {
  noChange: boolean;
  correction: DocumentCorrectionDto | null;
  region: DocumentRegionDto | null;
}

export interface ConfirmDocumentFieldRequest {
  fieldKey: string;
  value: string;
}

export interface ConfirmDocumentFieldResponse {
  confirmed: boolean;
  fieldKey: string;
  valueSha256: string;
}

export interface DocumentRegionSelectionPreview {
  page: number;
  rect: NormalizedRect;
  tokens: LayoutTokenDto[];
  snappedRect: NormalizedRect | null;
  text: string;
}
