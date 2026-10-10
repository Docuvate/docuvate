// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateStackDto, DuplicateStackMemberDto } from '@docuvate/contracts';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';
import { SyncUserHashDuplicatesUseCase } from './sync-user-hash-duplicates.use-case.js';

@Injectable()
export class SyncDuplicateStacksUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    private readonly syncUserHashDuplicates: SyncUserHashDuplicatesUseCase
  ) {}

  async execute(userId: string): Promise<void> {
    await this.syncUserHashDuplicates.execute(userId);
    await this.stacks.syncFromPendingCandidates(userId);
  }
}

@Injectable()
export class LinkDuplicatePairUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository
  ) {}

  async execute(userId: string, documentIdA: string, documentIdB: string): Promise<void> {
    if (await this.duplicates.isPairDismissed(userId, documentIdA, documentIdB)) {
      return;
    }
    await this.stacks.linkPair(userId, documentIdA, documentIdB);
  }
}

@Injectable()
export class GetDuplicateStackUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository
  ) {}

  async execute(documentId: string, userId: string): Promise<DuplicateStackDto | null> {
    const membership = await this.stacks.getMembership(documentId, userId);
    if (!membership) return null;

    const members = await this.stacks.listMembers(membership.stackId, userId);
    if (members.length === 0) return null;

    const primary = members.find((m) => m.role === 'primary') ?? members[0];
    const enriched = await Promise.all(
      members.map(async (member) => this.toMemberDto(member, primary.documentId, userId))
    );

    return {
      stackId: membership.stackId,
      primaryDocumentId: primary.documentId,
      members: enriched,
    };
  }

  private async toMemberDto(
    member: Awaited<ReturnType<DuplicateStackRepository['listMembers']>>[number],
    primaryDocumentId: string,
    userId: string
  ): Promise<DuplicateStackMemberDto> {
    if (member.documentId === primaryDocumentId) {
      return {
        documentId: member.documentId,
        role: member.role,
        title: member.title,
        filename: member.filename,
        status: member.status,
        mimeType: member.mimeType,
        similarity: null,
        source: null,
        candidateLinkDismissed: true,
      };
    }

    const forward = await this.duplicates.listForDocument(primaryDocumentId, userId);
    const reverse = await this.duplicates.listForDocument(member.documentId, userId);
    const link =
      forward.find((c) => c.candidateDocumentId === member.documentId) ??
      reverse.find((c) => c.candidateDocumentId === primaryDocumentId);

    return {
      documentId: member.documentId,
      role: member.role,
      title: member.title,
      filename: member.filename,
      status: member.status,
      mimeType: member.mimeType,
      similarity: link?.similarity ?? null,
      source: link?.source ?? null,
      candidateLinkDismissed: !link,
    };
  }
}

@Injectable()
export class SetDuplicateStackPrimaryUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository
  ) {}

  async execute(stackId: string, documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) throw new NotFoundException('Document not found');
    await this.stacks.setPrimary(userId, stackId, documentId);
  }
}

@Injectable()
export class ConfirmDuplicateVersionUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository
  ) {}

  async execute(
    primaryDocumentId: string,
    versionDocumentId: string,
    userId: string
  ): Promise<void> {
    const primary = await this.documents.findByIdForUser(primaryDocumentId, userId);
    const version = await this.documents.findByIdForUser(versionDocumentId, userId);
    if (!primary || !version) throw new NotFoundException('Document not found');

    await this.stacks.linkPair(userId, primaryDocumentId, versionDocumentId);
    await this.duplicates.dismiss(primaryDocumentId, versionDocumentId, userId);
  }
}

@Injectable()
export class ReleaseDuplicateStackMemberUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository
  ) {}

  async execute(primaryDocumentId: string, otherDocumentId: string, userId: string): Promise<void> {
    const primary = await this.documents.findByIdForUser(primaryDocumentId, userId);
    const other = await this.documents.findByIdForUser(otherDocumentId, userId);
    if (!primary || !other) throw new NotFoundException('Document not found');

    await this.duplicates.dismiss(primaryDocumentId, otherDocumentId, userId);
    await this.stacks.removeMember(userId, otherDocumentId);
  }
}

@Injectable()
export class HandleDuplicateStackDocumentDeletedUseCase {
  constructor(
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository
  ) {}

  async execute(userId: string, documentId: string): Promise<void> {
    await this.stacks.handleDocumentDeleted(userId, documentId);
  }
}
