// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardWidgetType,
  LibraryTableColumnId,
  SavedViewFilterMode,
  SavedViewListScope,
  SavedViewViewMode,
  SavedViewVisibility,
} from '@docuvate/contracts';
import type { DocumentSortField, DocumentStatus, SortOrder } from '@docuvate/contracts';

export interface SavedDocumentViewEntity {
  id: string;
  ownerUserId: string;
  name: string;
  visibility: SavedViewVisibility;
  searchQuery: string;
  sort: DocumentSortField;
  order: SortOrder;
  viewMode: SavedViewViewMode;
  filterMode: SavedViewFilterMode;
  listScope: SavedViewListScope;
  folderId: string | null;
  mappeId: string | null;
  correspondentId: string | null;
  status: DocumentStatus | null;
  inbox: boolean | null;
  withoutNonInboxLabel: boolean | null;
  documentDateFrom: string | null;
  documentDateTo: string | null;
  tagIds: string[];
  pinnedSidebar: boolean;
  position: number;
  visibleColumns: LibraryTableColumnId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidgetEntity {
  id: string;
  userId: string;
  type: DashboardWidgetType;
  position: number;
  widthCols: number;
  heightRows: number;
  savedViewId: string | null;
  itemLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidgetTemplate {
  type: DashboardWidgetType;
  position: number;
  widthCols: number;
  heightRows: number;
  savedViewId: string | null;
  itemLimit: number | null;
}
