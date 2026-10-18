// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DashboardWidgetDto, SavedDocumentViewDto } from '@docuvate/contracts';

import type { DashboardWidgetEntity, SavedDocumentViewEntity } from '../domain/workspace.types.js';

export function toSavedDocumentViewDto(
  entity: SavedDocumentViewEntity,
  extras?: { documentCount?: number }
): SavedDocumentViewDto {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description.trim() ? entity.description : undefined,
    documentCount: extras?.documentCount,
    visibility: entity.visibility,
    ownerUserId: entity.ownerUserId,
    searchQuery: entity.searchQuery,
    sort: entity.sort,
    order: entity.order,
    viewMode: entity.viewMode,
    filterMode: entity.filterMode,
    listScope: entity.listScope,
    folderId: entity.folderId,
    fieldFilters: entity.fieldFilters,
    status: entity.status,
    inbox: entity.inbox,
    withoutNonInboxLabel: entity.withoutNonInboxLabel,
    documentDateFrom: entity.documentDateFrom,
    documentDateTo: entity.documentDateTo,
    tagIds: entity.tagIds,
    pinnedSidebar: entity.pinnedSidebar,
    position: entity.position,
    visibleColumns: entity.visibleColumns,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function toDashboardWidgetDto(entity: DashboardWidgetEntity): DashboardWidgetDto {
  return {
    id: entity.id,
    type: entity.type,
    position: entity.position,
    widthCols: entity.widthCols,
    heightRows: entity.heightRows,
    savedViewId: entity.savedViewId,
    itemLimit: entity.itemLimit,
  };
}
