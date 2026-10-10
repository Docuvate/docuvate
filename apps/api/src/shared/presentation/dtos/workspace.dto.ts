// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CreateSavedDocumentViewRequest,
  DashboardLayoutResponse,
  DashboardStatisticsDto,
  DashboardWidgetDto,
  DashboardWidgetType,
  InstallationDashboardDefaultResponse,
  LibraryTableColumnId,
  ReorderSavedDocumentViewsRequest,
  ReplaceDashboardLayoutRequest,
  SavedDocumentViewDto,
  SavedDocumentViewListResponse,
  SavedViewFilterMode,
  SavedViewListScope,
  SavedViewViewMode,
  SavedViewVisibility,
  UpdateSavedDocumentViewRequest,
} from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const VISIBILITIES = ['private', 'shared'] as const;
const LIST_SCOPES = ['all', 'folder', 'mappe'] as const;
const VIEW_MODES = ['klassisch', 'karten', 'fokus'] as const;
const FILTER_MODES = ['ui', 'query'] as const;
const SORT_FIELDS = ['updatedAt', 'createdAt', 'title', 'documentDate'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;
const STATUSES = ['uploaded', 'queued', 'extracting', 'ready', 'failed'] as const;
const COLUMN_IDS = ['title', 'labels', 'date', 'status', 'folder', 'updated'] as const;
const WIDGET_TYPES = [
  'saved_view',
  'upload',
  'statistics',
  'recent_documents',
  'attention',
] as const;

export class SavedDocumentViewDtoClass implements SavedDocumentViewDto {
  id!: string;
  name!: string;
  visibility!: SavedViewVisibility;
  ownerUserId!: string;
  searchQuery!: string;
  sort!: (typeof SORT_FIELDS)[number];
  order!: (typeof SORT_ORDERS)[number];
  viewMode!: SavedViewViewMode;
  filterMode!: SavedViewFilterMode;
  listScope!: SavedViewListScope;
  folderId?: string | null;
  mappeId?: string | null;
  correspondentId?: string | null;
  status?: (typeof STATUSES)[number] | null;
  inbox?: boolean | null;
  withoutNonInboxLabel?: boolean | null;
  tagIds!: string[];
  pinnedSidebar!: boolean;
  position!: number;
  @ApiProperty({ enum: COLUMN_IDS, enumName: 'LibraryTableColumnId', isArray: true })
  visibleColumns!: LibraryTableColumnId[];
  createdAt!: string;
  updatedAt!: string;
}

export class SavedDocumentViewListResponseDto implements SavedDocumentViewListResponse {
  items!: SavedDocumentViewDtoClass[];
}

export class CreateSavedDocumentViewRequestDto implements CreateSavedDocumentViewRequest {
  @IsString()
  name!: string;

  @IsOptional()
  @IsIn([...VISIBILITIES])
  visibility?: SavedViewVisibility;

  @IsString()
  searchQuery!: string;

  @IsOptional()
  @IsIn([...SORT_FIELDS])
  sort?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn([...SORT_ORDERS])
  order?: (typeof SORT_ORDERS)[number];

  @IsOptional()
  @IsIn([...VIEW_MODES])
  viewMode?: SavedViewViewMode;

  @IsOptional()
  @IsIn([...FILTER_MODES])
  filterMode?: SavedViewFilterMode;

  @IsOptional()
  @IsIn([...LIST_SCOPES])
  listScope?: SavedViewListScope;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsUUID()
  mappeId?: string | null;

  @IsOptional()
  @IsUUID()
  correspondentId?: string | null;

  @IsOptional()
  @IsIn([...STATUSES])
  status?: (typeof STATUSES)[number] | null;

  @IsOptional()
  @IsBoolean()
  inbox?: boolean | null;

  @IsOptional()
  @IsBoolean()
  withoutNonInboxLabel?: boolean | null;

  @IsOptional()
  @IsString()
  documentDateFrom?: string | null;

  @IsOptional()
  @IsString()
  documentDateTo?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  pinnedSidebar?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn([...COLUMN_IDS], { each: true })
  @ApiPropertyOptional({ enum: COLUMN_IDS, enumName: 'LibraryTableColumnId', isArray: true })
  visibleColumns?: LibraryTableColumnId[];
}

export class UpdateSavedDocumentViewRequestDto implements UpdateSavedDocumentViewRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn([...VISIBILITIES])
  visibility?: SavedViewVisibility;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsIn([...SORT_FIELDS])
  sort?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn([...SORT_ORDERS])
  order?: (typeof SORT_ORDERS)[number];

  @IsOptional()
  @IsIn([...VIEW_MODES])
  viewMode?: SavedViewViewMode;

  @IsOptional()
  @IsIn([...FILTER_MODES])
  filterMode?: SavedViewFilterMode;

  @IsOptional()
  @IsIn([...LIST_SCOPES])
  listScope?: SavedViewListScope;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsUUID()
  mappeId?: string | null;

  @IsOptional()
  @IsUUID()
  correspondentId?: string | null;

  @IsOptional()
  @IsIn([...STATUSES])
  status?: (typeof STATUSES)[number] | null;

  @IsOptional()
  @IsBoolean()
  inbox?: boolean | null;

  @IsOptional()
  @IsBoolean()
  withoutNonInboxLabel?: boolean | null;

  @IsOptional()
  @IsString()
  documentDateFrom?: string | null;

  @IsOptional()
  @IsString()
  documentDateTo?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  pinnedSidebar?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn([...COLUMN_IDS], { each: true })
  @ApiPropertyOptional({ enum: COLUMN_IDS, enumName: 'LibraryTableColumnId', isArray: true })
  visibleColumns?: LibraryTableColumnId[];
}

export class ReorderSavedDocumentViewsRequestDto implements ReorderSavedDocumentViewsRequest {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}

export class DashboardWidgetInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsIn([...WIDGET_TYPES])
  type!: DashboardWidgetType;

  @IsInt()
  @Min(0)
  position!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  widthCols!: number;

  @IsInt()
  @Min(1)
  @Max(6)
  heightRows!: number;

  @IsOptional()
  @IsUUID()
  savedViewId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  itemLimit?: number | null;
}

export class ReplaceDashboardLayoutRequestDto implements ReplaceDashboardLayoutRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetInputDto)
  widgets!: DashboardWidgetInputDto[];
}

export class DashboardWidgetDtoClass implements DashboardWidgetDto {
  id!: string;
  type!: DashboardWidgetType;
  position!: number;
  widthCols!: number;
  heightRows!: number;
  savedViewId?: string | null;
  itemLimit?: number | null;
}

export class DashboardLayoutResponseDto implements DashboardLayoutResponse {
  widgets!: DashboardWidgetDtoClass[];
  editMode!: boolean;
}

export class DashboardStatisticsDtoClass implements DashboardStatisticsDto {
  documentsTotal!: number;
  byStatus!: Record<string, number>;
  labelsAssignedCount!: number;
  unlabeledCount!: number;
  topLabels!: { name: string; count: number }[];
}

export class InstallationDashboardDefaultResponseDto implements InstallationDashboardDefaultResponse {
  widgets!: DashboardWidgetInputDto[];
}
