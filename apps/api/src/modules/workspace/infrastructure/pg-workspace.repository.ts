// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type {
  CreateSavedDocumentViewRequest,
  DashboardWidgetType,
  LibraryTableColumnId,
  ReplaceDashboardLayoutRequest,
  UpdateSavedDocumentViewRequest,
} from '@docuvate/contracts';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  DashboardWidgetEntity,
  DashboardWidgetTemplate,
  SavedDocumentViewEntity,
} from '../domain/workspace.types.js';
import {
  assertDashboardWidgetType,
  parseDashboardWidgetFields,
} from '../domain/dashboard-widget-config.js';

function mapViewRow(row: Record<string, unknown>, tagIds: string[]): SavedDocumentViewEntity {
  return {
    id: String(row['id']),
    ownerUserId: String(row['owner_user_id']),
    name: String(row['name']),
    visibility: row['visibility'] as SavedDocumentViewEntity['visibility'],
    searchQuery: String(row['search_query'] ?? ''),
    sort: row['sort_field'] as SavedDocumentViewEntity['sort'],
    order: row['sort_order'] as SavedDocumentViewEntity['order'],
    viewMode: row['view_mode'] as SavedDocumentViewEntity['viewMode'],
    filterMode: row['filter_mode'] as SavedDocumentViewEntity['filterMode'],
    listScope: row['list_scope'] as SavedDocumentViewEntity['listScope'],
    folderId: row['folder_id'] != null ? String(row['folder_id']) : null,
    mappeId: row['mappe_id'] != null ? String(row['mappe_id']) : null,
    correspondentId: row['correspondent_id'] != null ? String(row['correspondent_id']) : null,
    status:
      row['status_filter'] != null
        ? (String(row['status_filter']) as SavedDocumentViewEntity['status'])
        : null,
    inbox: row['inbox_filter'] != null ? Boolean(row['inbox_filter']) : null,
    withoutNonInboxLabel:
      row['without_non_inbox_label'] != null ? Boolean(row['without_non_inbox_label']) : null,
    documentDateFrom: row['document_date_from'] != null ? String(row['document_date_from']) : null,
    documentDateTo: row['document_date_to'] != null ? String(row['document_date_to']) : null,
    tagIds,
    pinnedSidebar: Boolean(row['pinned_sidebar']),
    position: Number(row['position'] ?? 0),
    visibleColumns: Array.isArray(row['visible_columns'])
      ? (row['visible_columns'] as LibraryTableColumnId[])
      : ['title', 'labels', 'date', 'status'],
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'])),
  };
}

function mapWidgetRow(row: Record<string, unknown>): DashboardWidgetEntity {
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    type: row['widget_type'] as DashboardWidgetType,
    position: Number(row['position'] ?? 0),
    widthCols: Number(row['width_cols'] ?? 6),
    heightRows: Number(row['height_rows'] ?? 2),
    savedViewId: row['saved_view_id'] != null ? String(row['saved_view_id']) : null,
    itemLimit: row['item_limit'] != null ? Number(row['item_limit']) : null,
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'])),
  };
}

const DEFAULT_COLUMNS: LibraryTableColumnId[] = ['title', 'labels', 'date', 'status'];

@Injectable()
export class PgWorkspaceRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  private async loadTagIdsForViews(viewIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (viewIds.length === 0) return map;
    const result = await this.pool.query(
      `SELECT view_id, tag_id FROM saved_document_view_tags WHERE view_id = ANY($1::uuid[])`,
      [viewIds]
    );
    for (const row of result.rows) {
      const viewId = String(row['view_id']);
      const tagId = String(row['tag_id']);
      const list = map.get(viewId) ?? [];
      list.push(tagId);
      map.set(viewId, list);
    }
    return map;
  }

  async listViewsVisibleToUser(userId: string): Promise<SavedDocumentViewEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM saved_document_views
       WHERE owner_user_id = $1 OR visibility = 'shared'
       ORDER BY position ASC, name ASC`,
      [userId]
    );
    const ids = result.rows.map((r) => String(r['id']));
    const tagMap = await this.loadTagIdsForViews(ids);
    return result.rows.map((row) => mapViewRow(row, tagMap.get(String(row['id'])) ?? []));
  }

  async findViewById(id: string): Promise<SavedDocumentViewEntity | null> {
    const result = await this.pool.query(`SELECT * FROM saved_document_views WHERE id = $1`, [id]);
    if (!result.rows[0]) return null;
    const tagMap = await this.loadTagIdsForViews([id]);
    return mapViewRow(result.rows[0], tagMap.get(id) ?? []);
  }

  async nextViewPosition(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM saved_document_views WHERE owner_user_id = $1`,
      [userId]
    );
    return Number(result.rows[0]?.['next'] ?? 0);
  }

  async createView(
    id: string,
    userId: string,
    input: CreateSavedDocumentViewRequest,
    position: number
  ): Promise<SavedDocumentViewEntity> {
    const tagIds = input.tagIds ?? [];
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO saved_document_views (
          id, owner_user_id, name, visibility, search_query, sort_field, sort_order,
          view_mode, filter_mode, list_scope, folder_id, mappe_id, correspondent_id,
          status_filter, inbox_filter, without_non_inbox_label, document_date_from, document_date_to,
          pinned_sidebar, position, visible_columns
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb
        )
        RETURNING *`,
        [
          id,
          userId,
          input.name,
          input.visibility ?? 'private',
          input.searchQuery ?? '',
          input.sort ?? 'updatedAt',
          input.order ?? 'desc',
          input.viewMode ?? 'klassisch',
          input.filterMode ?? 'ui',
          input.listScope ?? 'all',
          input.folderId ?? null,
          input.mappeId ?? null,
          input.correspondentId ?? null,
          input.status ?? null,
          input.inbox ?? null,
          input.withoutNonInboxLabel ?? null,
          input.documentDateFrom ?? null,
          input.documentDateTo ?? null,
          input.pinnedSidebar ?? false,
          position,
          JSON.stringify(input.visibleColumns ?? DEFAULT_COLUMNS),
        ]
      );
      for (const tagId of tagIds) {
        await client.query(
          `INSERT INTO saved_document_view_tags (view_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, tagId]
        );
      }
      await client.query('COMMIT');
      return mapViewRow(result.rows[0]!, tagIds);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateView(
    id: string,
    input: UpdateSavedDocumentViewRequest
  ): Promise<SavedDocumentViewEntity> {
    const existing = await this.findViewById(id);
    if (!existing) throw new NotFoundError('Saved view');

    const assignments: string[] = [];
    const values: unknown[] = [id];
    let param = 2;

    const assign = (column: string, value: unknown) => {
      assignments.push(`${column} = $${param}`);
      values.push(value);
      param += 1;
    };

    if (input.name !== undefined) assign('name', input.name);
    if (input.visibility !== undefined) assign('visibility', input.visibility);
    if (input.searchQuery !== undefined) assign('search_query', input.searchQuery);
    if (input.sort !== undefined) assign('sort_field', input.sort);
    if (input.order !== undefined) assign('sort_order', input.order);
    if (input.viewMode !== undefined) assign('view_mode', input.viewMode);
    if (input.filterMode !== undefined) assign('filter_mode', input.filterMode);
    if (input.listScope !== undefined) assign('list_scope', input.listScope);
    if ('folderId' in input) assign('folder_id', input.folderId);
    if ('mappeId' in input) assign('mappe_id', input.mappeId);
    if ('correspondentId' in input) assign('correspondent_id', input.correspondentId);
    if ('status' in input) assign('status_filter', input.status);
    if ('inbox' in input) assign('inbox_filter', input.inbox);
    if ('withoutNonInboxLabel' in input)
      assign('without_non_inbox_label', input.withoutNonInboxLabel);
    if ('documentDateFrom' in input) assign('document_date_from', input.documentDateFrom);
    if ('documentDateTo' in input) assign('document_date_to', input.documentDateTo);
    if (input.pinnedSidebar !== undefined) assign('pinned_sidebar', input.pinnedSidebar);
    if (input.visibleColumns !== undefined) {
      assignments.push(`visible_columns = $${param}::jsonb`);
      values.push(JSON.stringify(input.visibleColumns));
      param += 1;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      let result;
      if (assignments.length > 0) {
        assignments.push('updated_at = now()');
        result = await client.query(
          `UPDATE saved_document_views SET ${assignments.join(', ')} WHERE id = $1 RETURNING *`,
          values
        );
      } else {
        result = await client.query(`SELECT * FROM saved_document_views WHERE id = $1`, [id]);
      }
      if (input.tagIds !== undefined) {
        await client.query(`DELETE FROM saved_document_view_tags WHERE view_id = $1`, [id]);
        for (const tagId of input.tagIds) {
          await client.query(
            `INSERT INTO saved_document_view_tags (view_id, tag_id) VALUES ($1, $2)`,
            [id, tagId]
          );
        }
      }
      await client.query('COMMIT');
      const tagIds = input.tagIds !== undefined ? input.tagIds : existing.tagIds;
      return mapViewRow(result.rows[0]!, tagIds);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteView(id: string): Promise<void> {
    const result = await this.pool.query(`DELETE FROM saved_document_views WHERE id = $1`, [id]);
    if (result.rowCount === 0) throw new NotFoundError('Saved view');
  }

  async reorderViews(userId: string, orderedIds: string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      let position = 0;
      for (const id of orderedIds) {
        await client.query(
          `UPDATE saved_document_views SET position = $3, updated_at = now()
           WHERE id = $1 AND owner_user_id = $2`,
          [id, userId, position]
        );
        position += 1;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listWidgetsForUser(userId: string): Promise<DashboardWidgetEntity[]> {
    const result = await this.pool.query(
      `SELECT * FROM dashboard_widgets WHERE user_id = $1 ORDER BY position ASC`,
      [userId]
    );
    return result.rows.map(mapWidgetRow);
  }

  async replaceWidgetsForUser(
    userId: string,
    widgets: ReplaceDashboardLayoutRequest['widgets']
  ): Promise<DashboardWidgetEntity[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM dashboard_widgets WHERE user_id = $1`, [userId]);
      const created: DashboardWidgetEntity[] = [];
      for (const widget of widgets) {
        const type = assertDashboardWidgetType(widget.type);
        const fields = parseDashboardWidgetFields(type, {
          savedViewId: widget.savedViewId,
          itemLimit: widget.itemLimit,
        });
        const result = await client.query(
          `INSERT INTO dashboard_widgets (
             id, user_id, widget_type, position, width_cols, height_rows, saved_view_id, item_limit
           )
           VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            widget.id ?? null,
            userId,
            type,
            widget.position,
            widget.widthCols,
            widget.heightRows,
            fields.savedViewId,
            fields.itemLimit,
          ]
        );
        created.push(mapWidgetRow(result.rows[0]!));
      }
      await client.query('COMMIT');
      return created.sort((a, b) => a.position - b.position);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async seedWidgetsFromTemplate(
    userId: string,
    template: DashboardWidgetTemplate[]
  ): Promise<void> {
    await this.replaceWidgetsForUser(
      userId,
      template.map((w) => ({
        type: w.type,
        position: w.position,
        widthCols: w.widthCols,
        heightRows: w.heightRows,
        savedViewId: w.savedViewId,
        itemLimit: w.itemLimit,
      }))
    );
  }

  async getInstallationDefaultTemplate(): Promise<DashboardWidgetTemplate[]> {
    const result = await this.pool.query(
      `SELECT * FROM installation_dashboard_widgets ORDER BY position ASC`
    );
    return result.rows.map((row) => {
      const type = assertDashboardWidgetType(String(row['widget_type']));
      return {
        type,
        position: Number(row['position'] ?? 0),
        widthCols: Number(row['width_cols'] ?? 6),
        heightRows: Number(row['height_rows'] ?? 2),
        savedViewId: row['saved_view_id'] != null ? String(row['saved_view_id']) : null,
        itemLimit: row['item_limit'] != null ? Number(row['item_limit']) : null,
      };
    });
  }

  async setInstallationDefaultTemplate(
    _adminUserId: string,
    widgets: ReplaceDashboardLayoutRequest['widgets']
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM installation_dashboard_widgets`);
      for (const widget of widgets) {
        const type = assertDashboardWidgetType(widget.type);
        const fields = parseDashboardWidgetFields(type, {
          savedViewId: widget.savedViewId,
          itemLimit: widget.itemLimit,
        });
        await client.query(
          `INSERT INTO installation_dashboard_widgets (
             widget_type, position, width_cols, height_rows, saved_view_id, item_limit
           )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            type,
            widget.position,
            widget.widthCols,
            widget.heightRows,
            fields.savedViewId,
            fields.itemLimit,
          ]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getDashboardStatistics(userId: string): Promise<{
    documentsTotal: number;
    byStatus: Record<string, number>;
    labelsAssignedCount: number;
    unlabeledCount: number;
    topLabels: { name: string; count: number }[];
  }> {
    const totalResult = await this.pool.query(
      `SELECT COUNT(*)::int AS c FROM documents d
       WHERE d.user_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM document_stack_members sm
           WHERE sm.document_id = d.id AND sm.role = 'version'
         )`,
      [userId]
    );
    const statusResult = await this.pool.query(
      `SELECT status, COUNT(*)::int AS c FROM documents d
       WHERE d.user_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM document_stack_members sm
           WHERE sm.document_id = d.id AND sm.role = 'version'
         )
       GROUP BY status`,
      [userId]
    );
    const labelsResult = await this.pool.query(
      `SELECT COUNT(DISTINCT dt.document_id)::int AS c
       FROM document_tags dt
       INNER JOIN documents d ON d.id = dt.document_id AND d.user_id = $1
       INNER JOIN tags t ON t.id = dt.tag_id AND t.is_inbox = false`,
      [userId]
    );
    const unlabeledResult = await this.pool.query(
      `SELECT COUNT(*)::int AS c
       FROM documents d
       WHERE d.user_id = $1
         AND d.status = 'ready'
         AND NOT EXISTS (
           SELECT 1 FROM document_stack_members sm
           WHERE sm.document_id = d.id AND sm.role = 'version'
         )
         AND NOT EXISTS (
           SELECT 1 FROM document_tags dtn
           JOIN tags nt ON nt.id = dtn.tag_id
           WHERE dtn.document_id = d.id AND nt.is_inbox = false
         )`,
      [userId]
    );
    const topLabelsResult = await this.pool.query(
      `SELECT t.name, COUNT(DISTINCT dt.document_id)::int AS c
       FROM tags t
       INNER JOIN document_tags dt ON dt.tag_id = t.id
       INNER JOIN documents d ON d.id = dt.document_id AND d.user_id = $1
       WHERE t.user_id = $1 AND t.is_inbox = false
       GROUP BY t.id, t.name
       ORDER BY c DESC, t.name ASC
       LIMIT 5`,
      [userId]
    );
    const byStatus: Record<string, number> = {
      uploaded: 0,
      queued: 0,
      extracting: 0,
      ready: 0,
      failed: 0,
    };
    for (const row of statusResult.rows) {
      byStatus[String(row['status'])] = Number(row['c'] ?? 0);
    }
    return {
      documentsTotal: Number(totalResult.rows[0]?.['c'] ?? 0),
      byStatus,
      labelsAssignedCount: Number(labelsResult.rows[0]?.['c'] ?? 0),
      unlabeledCount: Number(unlabeledResult.rows[0]?.['c'] ?? 0),
      topLabels: topLabelsResult.rows.map((row) => ({
        name: String(row['name']),
        count: Number(row['c'] ?? 0),
      })),
    };
  }
}
