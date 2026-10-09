// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
type DocumentSortField = 'updatedAt' | 'createdAt' | 'title' | 'documentDate';
type SortOrder = 'asc' | 'desc';
type DocumentStatus = 'uploaded' | 'queued' | 'extracting' | 'ready' | 'failed';

export type SavedViewVisibility = 'private' | 'shared';
export type SavedViewListScope = 'all' | 'folder' | 'mappe';
export type SavedViewViewMode = 'klassisch' | 'karten' | 'fokus';
export type SavedViewFilterMode = 'ui' | 'query';

export type LibraryTableColumnId = 'title' | 'labels' | 'date' | 'status' | 'folder' | 'updated';

export interface SavedDocumentViewDto {
  id: string;
  name: string;
  visibility: SavedViewVisibility;
  ownerUserId: string;
  searchQuery: string;
  sort: DocumentSortField;
  order: SortOrder;
  viewMode: SavedViewViewMode;
  filterMode: SavedViewFilterMode;
  listScope: SavedViewListScope;
  folderId?: string | null;
  mappeId?: string | null;
  correspondentId?: string | null;
  status?: DocumentStatus | null;
  inbox?: boolean | null;
  withoutNonInboxLabel?: boolean | null;
  documentDateFrom?: string | null;
  documentDateTo?: string | null;
  tagIds: string[];
  pinnedSidebar: boolean;
  position: number;
  visibleColumns: LibraryTableColumnId[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedDocumentViewListResponse {
  items: SavedDocumentViewDto[];
}

export interface CreateSavedDocumentViewRequest {
  name: string;
  visibility?: SavedViewVisibility;
  searchQuery: string;
  sort?: DocumentSortField;
  order?: SortOrder;
  viewMode?: SavedViewViewMode;
  filterMode?: SavedViewFilterMode;
  listScope?: SavedViewListScope;
  folderId?: string | null;
  mappeId?: string | null;
  correspondentId?: string | null;
  status?: DocumentStatus | null;
  inbox?: boolean | null;
  withoutNonInboxLabel?: boolean | null;
  documentDateFrom?: string | null;
  documentDateTo?: string | null;
  tagIds?: string[];
  pinnedSidebar?: boolean;
  visibleColumns?: LibraryTableColumnId[];
}

export interface UpdateSavedDocumentViewRequest {
  name?: string;
  visibility?: SavedViewVisibility;
  searchQuery?: string;
  sort?: DocumentSortField;
  order?: SortOrder;
  viewMode?: SavedViewViewMode;
  filterMode?: SavedViewFilterMode;
  listScope?: SavedViewListScope;
  folderId?: string | null;
  mappeId?: string | null;
  correspondentId?: string | null;
  status?: DocumentStatus | null;
  inbox?: boolean | null;
  withoutNonInboxLabel?: boolean | null;
  documentDateFrom?: string | null;
  documentDateTo?: string | null;
  tagIds?: string[];
  pinnedSidebar?: boolean;
  visibleColumns?: LibraryTableColumnId[];
}

export interface ReorderSavedDocumentViewsRequest {
  orderedIds: string[];
}

export type DashboardWidgetType =
  'saved_view' | 'upload' | 'statistics' | 'recent_documents' | 'attention';

export interface DashboardWidgetDto {
  id: string;
  type: DashboardWidgetType;
  position: number;
  widthCols: number;
  heightRows: number;
  savedViewId?: string | null;
  itemLimit?: number | null;
}

export interface DashboardLayoutResponse {
  widgets: DashboardWidgetDto[];
  editMode: boolean;
}

export interface ReplaceDashboardLayoutRequest {
  widgets: Array<{
    id?: string;
    type: DashboardWidgetType;
    position: number;
    widthCols: number;
    heightRows: number;
    savedViewId?: string | null;
    itemLimit?: number | null;
  }>;
}

export interface DashboardLabelCountDto {
  name: string;
  count: number;
}

export interface DashboardStatisticsDto {
  documentsTotal: number;
  byStatus: Record<DocumentStatus, number>;
  labelsAssignedCount: number;
  unlabeledCount: number;
  topLabels: DashboardLabelCountDto[];
}

export interface InstallationDashboardDefaultResponse {
  widgets: ReplaceDashboardLayoutRequest['widgets'];
}
