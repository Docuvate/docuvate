// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateCandidateSource, DuplicateSetDto } from '@docuvate/contracts';
import {
  duplicateSetBulkArchiveEligible,
  duplicateSetDisplaySimilarityPercent,
  duplicateSetIdFromDocumentIds,
  duplicateSetMaxSimilarityForDisplay,
  groupDuplicatePairsIntoSets,
  parseDuplicateSetId,
} from '@docuvate/contracts';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';

function pairKey(documentIdA: string, documentIdB: string): string {
  return documentIdA < documentIdB
    ? `${documentIdA}:${documentIdB}`
    : `${documentIdB}:${documentIdA}`;
}

@Injectable()
export class ListDuplicateSetsUseCase {
  constructor(
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository
  ) {}

  async execute(userId: string, focusDocumentId?: string): Promise<DuplicateSetDto[]> {
    const rows = await this.duplicates.listActiveCandidates(userId);
    const pairs = rows.map((row) => ({
      documentId: row.documentId,
      candidateDocumentId: row.candidateDocumentId,
    }));
    const grouped = groupDuplicatePairsIntoSets(pairs);
    const filtered =
      focusDocumentId != null
        ? grouped.filter((ids) => ids.includes(focusDocumentId))
        : grouped;

    const pairMeta = new Map<
      string,
      { similarity: number; source: DuplicateCandidateSource }
    >();
    for (const row of rows) {
      const key = pairKey(row.documentId, row.candidateDocumentId);
      const existing = pairMeta.get(key);
      if (!existing || row.similarity > existing.similarity) {
        pairMeta.set(key, { similarity: row.similarity, source: row.source });
      }
    }

    const sets: DuplicateSetDto[] = [];
    for (const documentIds of filtered) {
      const documents = await Promise.all(
        documentIds.map(async (documentId) => {
          const doc = await this.documents.findByIdForUser(documentId, userId);
          if (!doc) return null;
          return {
            documentId: doc.id,
            title: doc.title,
            filename: doc.filename,
            createdAt: doc.createdAt.toISOString(),
          };
        })
      );
      const present = documents.filter((doc) => doc != null);
      if (present.length < 2) continue;

      const pairMetaEdges: {
        documentId: string;
        candidateDocumentId: string;
        similarity: number;
        source: DuplicateCandidateSource;
      }[] = [];
      const sources = new Set<DuplicateCandidateSource>();
      for (let i = 0; i < documentIds.length; i += 1) {
        for (let j = i + 1; j < documentIds.length; j += 1) {
          const left = documentIds[i];
          const right = documentIds[j];
          if (!left || !right) continue;
          const meta = pairMeta.get(pairKey(left, right));
          if (!meta) continue;
          pairMetaEdges.push({
            documentId: left,
            candidateDocumentId: right,
            similarity: meta.similarity,
            source: meta.source,
          });
          sources.add(meta.source);
        }
      }

      const bulkArchiveEligible = duplicateSetBulkArchiveEligible(documentIds, pairMetaEdges);
      const maxSimilarity = duplicateSetMaxSimilarityForDisplay(pairMetaEdges, bulkArchiveEligible);
      const similarityPercent = duplicateSetDisplaySimilarityPercent({
        bulkArchiveEligible,
        maxSimilarity,
        sources: [...sources],
      });

      sets.push({
        setId: duplicateSetIdFromDocumentIds(documentIds),
        documents: present.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        maxSimilarity,
        similarityPercent,
        bulkArchiveEligible,
        sources: [...sources],
      });
    }

    return sets.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
  }
}

@Injectable()
export class DismissDuplicateSetUseCase {
  constructor(
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository
  ) {}

  async execute(userId: string, setId: string): Promise<void> {
    const documentIds = parseDuplicateSetId(setId);
    if (documentIds.length < 2) {
      throw new NotFoundException('Duplicate set not found');
    }

    for (let i = 0; i < documentIds.length; i += 1) {
      for (let j = i + 1; j < documentIds.length; j += 1) {
        const left = documentIds[i];
        const right = documentIds[j];
        if (!left || !right) continue;
        await this.duplicates.dismiss(left, right, userId);
      }
    }

    for (const documentId of documentIds) {
      const membership = await this.stacks.getMembership(documentId, userId);
      if (membership?.role === 'version') {
        await this.stacks.removeMember(userId, documentId);
      }
    }
  }
}

@Injectable()
export class ArchiveDuplicateSetUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository
  ) {}

  async execute(userId: string, setId: string): Promise<void> {
    const documentIds = parseDuplicateSetId(setId);
    if (documentIds.length < 2) {
      throw new NotFoundException('Duplicate set not found');
    }

    const rows = await this.duplicates.listActiveCandidates(userId);
    const pairMetaEdges = rows
      .filter(
        (row) =>
          documentIds.includes(row.documentId) && documentIds.includes(row.candidateDocumentId)
      )
      .map((row) => ({
        documentId: row.documentId,
        candidateDocumentId: row.candidateDocumentId,
        similarity: row.similarity,
        source: row.source,
      }));
    if (!duplicateSetBulkArchiveEligible(documentIds, pairMetaEdges)) {
      throw new BadRequestException(
        'Bulk-Archivierung ist nur für byte-identische Duplikatgruppen verfügbar.'
      );
    }

    const loaded = await Promise.all(
      documentIds.map(async (documentId) => {
        const doc = await this.documents.findByIdForUser(documentId, userId);
        return doc ? { id: doc.id, createdAt: doc.createdAt } : null;
      })
    );
    const present = loaded.filter((row) => row != null);
    if (present.length < 2) {
      throw new NotFoundException('Duplicate set not found');
    }

    const sortedByNewest = [...present].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const keeper = sortedByNewest.at(0);
    if (keeper === undefined) {
      throw new NotFoundException('Duplicate set not found');
    }

    for (const other of present) {
      if (other.id === keeper.id) continue;
      await this.stacks.linkPair(userId, keeper.id, other.id);
      await this.duplicates.dismiss(keeper.id, other.id, userId);
    }

    const membership = await this.stacks.getMembership(keeper.id, userId);
    if (membership && membership.role !== 'primary') {
      await this.stacks.setPrimary(userId, membership.stackId, keeper.id);
    }
  }
}
