// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { EmbeddingDensityWorkerState } from '../domain/embedding-density-worker-state.schema.js';
import type {
  EmbeddingDensityTrainingExamples,
  PgEmbeddingDensityRepository,
} from './pg-embedding-density.repository.js';

/** OpenAPI export / contract tests: no TypeORM `forFeature` repositories. */
@Injectable()
export class HeadlessPgEmbeddingDensityRepository implements Pick<
  PgEmbeddingDensityRepository,
  | 'isCalibrationReady'
  | 'loadWorkerState'
  | 'persistWorkerState'
  | 'listTrainingExamples'
  | 'persistCalibrationBundle'
  | 'persistCorrection'
  | 'withdrawLabelCorrection'
  | 'findLabelCorrectionAssignment'
  | 'recordPropagatedAssignment'
  | 'listPropagatedAssignments'
  | 'listUsersWithCalibrationReady'
  | 'activeCalibrationExampleCount'
  | 'loadFineConfirmThresholdMap'
> {
  loadFineConfirmThresholdMap(): Promise<Map<string, number>> {
    return Promise.resolve(new Map());
  }

  isCalibrationReady(): Promise<boolean> {
    return Promise.resolve(false);
  }

  loadWorkerState(): Promise<EmbeddingDensityWorkerState | null> {
    return Promise.resolve(null);
  }

  persistWorkerState(): Promise<void> {
    return Promise.resolve();
  }

  listTrainingExamples(): Promise<EmbeddingDensityTrainingExamples> {
    return Promise.resolve({ vectors: [], labelIds: [], documentIds: [], allLabelIds: [] });
  }

  persistCalibrationBundle(): Promise<void> {
    return Promise.resolve();
  }

  persistCorrection(): Promise<string | null> {
    return Promise.resolve(null);
  }

  withdrawLabelCorrection(): Promise<boolean> {
    return Promise.resolve(false);
  }

  findLabelCorrectionAssignment(): Promise<{ fromTagId: string | null; toTagId: string } | null> {
    return Promise.resolve(null);
  }

  recordPropagatedAssignment(): Promise<void> {
    return Promise.resolve();
  }

  listPropagatedAssignments(): Promise<
    { documentId: string; tagId: string; inboxCleared: boolean }[]
  > {
    return Promise.resolve([]);
  }

  listUsersWithCalibrationReady(): Promise<string[]> {
    return Promise.resolve([]);
  }

  activeCalibrationExampleCount(): Promise<number | null> {
    return Promise.resolve(null);
  }
}
