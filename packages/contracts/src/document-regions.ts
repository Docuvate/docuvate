// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { LayoutToken, NormalizedRect } from './region-geometry.js';

export type DocumentRegionShape = 'rect' | 'polygon';
export type DocumentRegionRole = 'field' | 'table' | 'block' | 'ignore';
export type DocumentCorrectionKind = 'label' | 'field' | 'table' | 'block';
export type DocumentCorrectionStatus = 'active' | 'withdrawn';
export type FieldCorrectionOp = 'create' | 'reanchor' | 'edit_value' | 'remove';
export type FieldCorrectionScope = 'document' | 'label' | 'always';

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
  op: FieldCorrectionOp;
  fieldKey: string;
  beforeRegionId: string | null;
  afterRegionId: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface ApplyFieldCorrectionResponse {
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
