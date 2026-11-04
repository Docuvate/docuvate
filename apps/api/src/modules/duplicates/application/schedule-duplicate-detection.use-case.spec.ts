// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateDetectionMode } from '@docuvate/contracts';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { WORKSPACE_ML_SETTINGS_REPOSITORY } from '../../../shared/domain/ports.js';
import {
  createWorkspaceMlSettings,
  createWorkspaceMlSettingsRepositoryStub,
} from '../../../test-support/workspace-ml-settings-repository.stub.js';
import { DuplicateDetectionQueueService } from '../infrastructure/duplicate-detection-queue.service.js';
import { ApplyExactDuplicateDetectionUseCase } from './apply-exact-duplicate-detection.use-case.js';
import { ScheduleDuplicateDetectionUseCase } from './schedule-duplicate-detection.use-case.js';

async function runWithMode(duplicateDetection: DuplicateDetectionMode) {
  const exact = vi.fn().mockResolvedValue(undefined);
  const enqueueFuzzy = vi.fn().mockResolvedValue(undefined);
  const moduleRef = await Test.createTestingModule({
    providers: [
      ScheduleDuplicateDetectionUseCase,
      { provide: ApplyExactDuplicateDetectionUseCase, useValue: { execute: exact } },
      { provide: DuplicateDetectionQueueService, useValue: { enqueueFuzzy } },
      {
        provide: WORKSPACE_ML_SETTINGS_REPOSITORY,
        useValue: createWorkspaceMlSettingsRepositoryStub(
          createWorkspaceMlSettings({ duplicateDetection })
        ),
      },
    ],
  }).compile();
  await moduleRef.get(ScheduleDuplicateDetectionUseCase).execute('doc-1', 'user-1', 'sha');
  return { exact, enqueueFuzzy };
}

describe('ScheduleDuplicateDetectionUseCase', () => {
  it('skips all detection when the workspace turned duplicates off', async () => {
    const { exact, enqueueFuzzy } = await runWithMode('off');
    expect(exact).not.toHaveBeenCalled();
    expect(enqueueFuzzy).not.toHaveBeenCalled();
  });

  it('runs only exact detection in exact mode', async () => {
    const { exact, enqueueFuzzy } = await runWithMode('exact');
    expect(exact).toHaveBeenCalledWith('doc-1', 'user-1', 'sha');
    expect(enqueueFuzzy).not.toHaveBeenCalled();
  });

  it('also queues similarity detection in similar mode', async () => {
    const { exact, enqueueFuzzy } = await runWithMode('similar');
    expect(exact).toHaveBeenCalledOnce();
    expect(enqueueFuzzy).toHaveBeenCalledWith('doc-1', 'user-1');
  });
});
