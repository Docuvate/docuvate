import { Inject, Injectable } from '@nestjs/common';
import type { DocumentListQuery } from '@docuvate/contracts';
import type { DocumentDuplicateStackSummaryDto } from '@docuvate/contracts';
import {
  DOCUMENT_REPOSITORY,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DocumentRepository,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';
import { SyncDuplicateStacksUseCase } from '../../duplicates/application/duplicate-stack.use-cases.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { DocumentEntity } from '../domain/document.entity.js';

export interface ListedDocument {
  entity: DocumentEntity;
  duplicateCandidateCount: number;
  duplicateStack: DocumentDuplicateStackSummaryDto | null;
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
  ): Promise<ListedDocument[]> {
    await this.documentAuthz.assertCollection(subject, 'document:list');
    await this.syncDuplicateStacks.execute(userId);
    const entities = await this.documentAuthz.filterDocuments(
      subject,
      await this.documents.listForUser(userId, filters)
    );
    const duplicateCounts = await this.duplicates.countPendingByDocumentIds(
      userId,
      entities.map((d) => d.id)
    );
    const stackSummaries = await this.stacks.summariesForPrimaryDocuments(
      userId,
      entities.map((d) => d.id)
    );
    return entities.map((entity) => ({
      entity,
      duplicateCandidateCount: duplicateCounts.get(entity.id) ?? 0,
      duplicateStack: stackSummaries.get(entity.id) ?? null,
    }));
  }
}
