// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  EXTRACTION_PORT,
  OBJECT_STORAGE,
  USER_PREFERENCES_REPOSITORY,
  type DocumentRepository,
  type ExtractionPort,
  type ObjectStorage,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { pickHeuristicArenaWinner } from '../../../shared/domain/arena-heuristic.js';

@Injectable()
export class RunArenaSampleCompareUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(EXTRACTION_PORT) private readonly extraction: ExtractionPort,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository
  ) {}

  async execute(documentId: string): Promise<void> {
    const doc = await this.documents.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    const buffer = await this.storage.getObject(doc.storageKey);
    const compared = await this.extraction.compare(buffer, doc.mimeType, [], 3);
    const winner = pickHeuristicArenaWinner(compared.items);
    if (!winner) {
      return;
    }

    await this.prefs.recordArenaRating({
      userId: doc.userId,
      documentId,
      winnerEngine: winner,
      comparedEngines: compared.engines,
      rating: null,
      source: 'sample',
      compareSnapshot: {
        maxPages: 3,
        items: compared.items.map((item) => ({
          engine: item.engine,
          elapsedMs: item.elapsedMs,
          error: item.error ?? null,
          charCount: item.charCount ?? null,
          blockCount: item.blockCount ?? null,
        })),
      },
    });
  }
}
