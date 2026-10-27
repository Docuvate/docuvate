// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DashboardWidgetDocumentPreviewsQuery,
  DashboardWidgetDocumentPreviewsResponseDto,
  DocumentListQuery,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';
import { parseNumber, parseString, requireRecord } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { clampCursorListLimit } from '../../../shared/infrastructure/pagination/clamp-cursor-list-limit.js';
import { toDocumentListItemDto } from '../../documents/presentation/document.mapper.js';
import { savedViewToDocumentListQuery } from '../domain/saved-view-list-query.js';
import { PgWorkspaceRepository } from '../infrastructure/pg-workspace.repository.js';

@Injectable()
export class GetDashboardWidgetDocumentPreviewsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    private readonly workspace: PgWorkspaceRepository,
    private readonly documentAuthz: DocumentAuthorizationService,
    @Inject(PG_POOL) private readonly pool: pg.Pool
  ) {}

  async execute(
    userId: string,
    subject: AuthorizationSubject,
    query: DashboardWidgetDocumentPreviewsQuery
  ): Promise<DashboardWidgetDocumentPreviewsResponseDto> {
    await this.documentAuthz.assertCollection(subject, 'document:list');
    const limit = clampCursorListLimit(query.limit);

    let filters: DocumentListQuery;
    let attentionCount: number | undefined;

    switch (query.type) {
      case 'recent_documents':
        filters = { sort: 'createdAt', order: 'desc', limit };
        break;
      case 'attention':
        attentionCount = await this.countAttentionDocuments(userId);
        return this.buildAttentionPreview(userId, subject, limit, attentionCount);
      case 'saved_view': {
        const savedViewId = query.savedViewId?.trim();
        if (!savedViewId) {
          throw new NotFoundError('Saved view not found');
        }
        const view = await this.workspace.findViewById(savedViewId);
        if (!view) {
          throw new NotFoundError('Saved view not found');
        }
        filters = { ...savedViewToDocumentListQuery(view), limit };
        break;
      }
      default: {
        const _exhaustive: never = query.type;
        throw new Error(`Unsupported widget preview type: ${String(_exhaustive)}`);
      }
    }

    const page = await this.documents.listPageForUser(userId, filters);
    const authorized = await this.documentAuthz.filterDocuments(subject, page.entities);
    const duplicateCounts = await this.duplicates.countPendingByDocumentIds(
      userId,
      authorized.map((d) => d.id)
    );
    const stackSummaries = await this.stacks.summariesForPrimaryDocuments(
      userId,
      authorized.map((d) => d.id)
    );

    return {
      items: authorized.map((entity) =>
        toDocumentListItemDto(
          entity,
          duplicateCounts.get(entity.id) ?? 0,
          stackSummaries.get(entity.id) ?? null
        )
      ),
      attentionCount,
    };
  }

  private async countAttentionDocuments(userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS count
       FROM documents d
       WHERE d.user_id = $1 AND d.status IN ('failed', 'extracting')`,
      [userId]
    );
    const row = requireRecord(result.rows[0] ?? {});
    return parseNumber(row.count, 0);
  }

  private async buildAttentionPreview(
    userId: string,
    subject: AuthorizationSubject,
    limit: number,
    attentionCount: number
  ): Promise<DashboardWidgetDocumentPreviewsResponseDto> {
    const result = await this.pool.query(
      `SELECT d.id
       FROM documents d
       WHERE d.user_id = $1 AND d.status IN ('failed', 'extracting')
       ORDER BY d.updated_at DESC, d.id DESC
       LIMIT $2`,
      [userId, limit]
    );
    const ids = result.rows.map((raw) => parseString(requireRecord(raw).id));
    const entities = (
      await Promise.all(ids.map((id) => this.documents.findByIdForUser(id, userId)))
    ).filter((doc) => doc != null);
    const authorized = await this.documentAuthz.filterDocuments(subject, entities);
    const duplicateCounts = await this.duplicates.countPendingByDocumentIds(
      userId,
      authorized.map((d) => d.id)
    );
    const stackSummaries = await this.stacks.summariesForPrimaryDocuments(
      userId,
      authorized.map((d) => d.id)
    );
    return {
      items: authorized.map((entity) =>
        toDocumentListItemDto(
          entity,
          duplicateCounts.get(entity.id) ?? 0,
          stackSummaries.get(entity.id) ?? null
        )
      ),
      attentionCount,
    };
  }
}
