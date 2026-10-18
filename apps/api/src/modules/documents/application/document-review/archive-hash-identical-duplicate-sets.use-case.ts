// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import {
  ArchiveDuplicateSetUseCase,
  ListDuplicateSetsUseCase,
} from '../../../duplicates/application/duplicate-set.use-cases.js';

export interface ArchiveHashIdenticalDuplicateSetsResult {
  setsArchived: number;
}

@Injectable()
export class ArchiveHashIdenticalDuplicateSetsUseCase {
  constructor(
    private readonly listSets: ListDuplicateSetsUseCase,
    private readonly archiveSet: ArchiveDuplicateSetUseCase
  ) {}

  async execute(userId: string): Promise<ArchiveHashIdenticalDuplicateSetsResult> {
    const sets = await this.listSets.execute(userId);
    let setsArchived = 0;
    for (const set of sets) {
      if (!set.bulkArchiveEligible) {
        continue;
      }
      await this.archiveSet.execute(userId, set.setId);
      setsArchived += 1;
    }
    return { setsArchived };
  }
}
