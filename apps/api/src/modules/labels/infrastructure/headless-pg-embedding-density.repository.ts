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
  | 'listUsersWithCalibrationReady'
  | 'activeCalibrationExampleCount'
> {
  async isCalibrationReady(_userId: string): Promise<boolean> {
    return false;
  }

  async loadWorkerState(
    _userId: string,
    _tagIds: string[]
  ): Promise<EmbeddingDensityWorkerState | null> {
    return null;
  }

  async persistWorkerState(_userId: string, _state: EmbeddingDensityWorkerState): Promise<void> {
    return undefined;
  }

  async listTrainingExamples(_userId: string): Promise<EmbeddingDensityTrainingExamples> {
    return { vectors: [], labelIds: [], documentIds: [], allLabelIds: [] };
  }

  async persistCalibrationBundle(
    _userId: string,
    _state: EmbeddingDensityWorkerState,
    _meta: { nDocuments: number; nExamples: number; delta: number }
  ): Promise<void> {
    return undefined;
  }

  async persistCorrection(
    _userId: string,
    _documentId: string,
    _fromTagId: string | null,
    _toTagId: string,
    _createdBy: string,
    _state: EmbeddingDensityWorkerState,
    _tagIds: string[]
  ): Promise<void> {
    return undefined;
  }

  async listUsersWithCalibrationReady(): Promise<string[]> {
    return [];
  }

  async activeCalibrationExampleCount(_userId: string): Promise<number | null> {
    return null;
  }
}
