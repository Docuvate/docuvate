// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type DashboardWidgetPreviewType = 'recent_documents' | 'attention' | 'saved_view';

export interface DashboardWidgetDocumentPreviewsQuery {
  type: DashboardWidgetPreviewType;
  limit?: number;
  savedViewId?: string;
}

export interface DashboardWidgetDocumentPreviewsResponseDto {
  items: import('./index.js').DocumentListItemDto[];
  attentionCount?: number;
}
