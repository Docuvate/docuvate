// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import {
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
} from '../../../shared/domain/ports.js';
import { DuplicateDetectionQueueService } from '../infrastructure/duplicate-detection-queue.service.js';
import { ApplyExactDuplicateDetectionUseCase } from './apply-exact-duplicate-detection.use-case.js';

@Injectable()
export class ScheduleDuplicateDetectionUseCase {
  constructor(
    private readonly applyExactDuplicateDetection: ApplyExactDuplicateDetectionUseCase,
    private readonly duplicateQueue: DuplicateDetectionQueueService,
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly preferences: UserPreferencesRepository
  ) {}

  async execute(documentId: string, userId: string, contentHash: string | null): Promise<void> {
    await this.applyExactDuplicateDetection.execute(documentId, userId, contentHash);

    const prefs = await this.preferences.getForUser(userId);
    if (!prefs.fuzzyDuplicateDetectionEnabled) {
      return;
    }
    await this.duplicateQueue.enqueueFuzzy(documentId, userId);
  }
}
