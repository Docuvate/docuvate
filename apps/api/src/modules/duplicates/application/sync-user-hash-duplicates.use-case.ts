// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';

/** Every (earlier, later) pair of non-empty ids within a group, in index order. */
function* orderedPairs(group: readonly string[]): Generator<[string, string]> {
  for (let i = 0; i < group.length; i += 1) {
    const documentId = group[i];
    if (!documentId) continue;
    for (let j = i + 1; j < group.length; j += 1) {
      const candidateId = group[j];
      if (candidateId) yield [documentId, candidateId];
    }
  }
}

@Injectable()
export class SyncUserHashDuplicatesUseCase {
  private readonly logger = new Logger(SyncUserHashDuplicatesUseCase.name);

  constructor(
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository
  ) {}

  async execute(userId: string): Promise<void> {
    try {
      const groups = await this.duplicates.listDocumentIdsBySharedHash(userId);
      for (const group of groups) {
        for (const [documentId, candidateId] of orderedPairs(group)) {
          if (await this.duplicates.isPairDismissed(userId, documentId, candidateId)) {
            continue;
          }
          await this.duplicates.upsertCandidate(userId, documentId, candidateId, 1, 'hash');
          await this.stacks.linkPair(userId, documentId, candidateId);
        }
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Hash duplicate sync skipped for ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
