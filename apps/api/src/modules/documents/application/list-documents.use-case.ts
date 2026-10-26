// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';
import type { DocumentDuplicateStackSummaryDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';
import { SyncDuplicateStacksUseCase } from '../../duplicates/application/duplicate-stack.use-cases.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import { isPaginatedDocumentListQuery } from '../infrastructure/document-list-pagination.js';

export interface ListedDocument {
  entity: DocumentEntity;
  duplicateCandidateCount: number;
  duplicateStack: DocumentDuplicateStackSummaryDto | null;
}

export interface ListedDocumentPage {
  items: ListedDocument[];
  hasMore: boolean;
  nextCursor: string | null;
  total: number | null;
}

function filtersWithoutPagination(filters: DocumentListQuery): DocumentListQuery {
  const next: DocumentListQuery = { ...filters };
  delete next.limit;
  delete next.cursor;
  return next;
}

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    private readonly syncDuplicateStacks: SyncDuplicateStacksUseCase,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    userId: string,
    subject: AuthorizationSubject,
    filters: DocumentListQuery = {}
  ): Promise<ListedDocumentPage> {
    await this.documentAuthz.assertCollection(subject, 'document:list');
    await this.syncDuplicateStacks.execute(userId);

    const paginated = isPaginatedDocumentListQuery(filters);
    let entities: DocumentEntity[];
    let hasMore = false;
    let nextCursor: string | null = null;

    if (paginated) {
      const page = await this.documents.listPageForUser(userId, filters);
      entities = page.entities;
      hasMore = page.hasMore;
      nextCursor = page.nextCursor;
    } else {
      entities = await this.documents.listForUser(userId, filters);
    }

    const filtered = await this.documentAuthz.filterDocuments(subject, entities);
    const duplicateCounts = await this.duplicates.countPendingByDocumentIds(
      userId,
      filtered.map((d) => d.id)
    );
    const stackSummaries = await this.stacks.summariesForPrimaryDocuments(
      userId,
      filtered.map((d) => d.id)
    );
    const items = filtered.map((entity) => ({
      entity,
      duplicateCandidateCount: duplicateCounts.get(entity.id) ?? 0,
      duplicateStack: stackSummaries.get(entity.id) ?? null,
    }));

    const total =
      paginated && !filters.cursor
        ? await this.documents.countForUser(userId, filtersWithoutPagination(filters))
        : null;

    return { items, hasMore, nextCursor, total };
  }
}
