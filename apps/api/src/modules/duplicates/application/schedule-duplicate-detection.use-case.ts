// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import {
  WORKSPACE_ML_SETTINGS_REPOSITORY,
  type WorkspaceMlSettingsRepository,
} from '../../../shared/domain/ports.js';
import { DuplicateDetectionQueueService } from '../infrastructure/duplicate-detection-queue.service.js';
import { ApplyExactDuplicateDetectionUseCase } from './apply-exact-duplicate-detection.use-case.js';

/** Runs duplicate detection for a new document according to the workspace mode. */
@Injectable()
export class ScheduleDuplicateDetectionUseCase {
  constructor(
    @Inject(ApplyExactDuplicateDetectionUseCase)
    private readonly applyExactDuplicateDetection: ApplyExactDuplicateDetectionUseCase,
    @Inject(DuplicateDetectionQueueService)
    private readonly duplicateQueue: DuplicateDetectionQueueService,
    @Inject(WORKSPACE_ML_SETTINGS_REPOSITORY)
    private readonly workspaceSettings: WorkspaceMlSettingsRepository
  ) {}

  async execute(documentId: string, userId: string, contentHash: string | null): Promise<void> {
    const { duplicateDetection } = await this.workspaceSettings.get();
    if (duplicateDetection === 'off') {
      return;
    }
    await this.applyExactDuplicateDetection.execute(documentId, userId, contentHash);
    if (duplicateDetection === 'similar') {
      await this.duplicateQueue.enqueueFuzzy(documentId, userId);
    }
  }
}
