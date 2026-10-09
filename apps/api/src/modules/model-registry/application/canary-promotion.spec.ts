// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { SetMlModelVersionLifecycleUseCase } from './model-registry.use-cases.js';
import type { ModelRegistryRepository } from '../domain/model-registry.repository.port.js';
import type { MlModelVersionEntity } from '../domain/model-registry.types.js';

function version(
  partial: Partial<MlModelVersionEntity> & Pick<MlModelVersionEntity, 'id' | 'familyId'>
): MlModelVersionEntity {
  return {
    versionTag: 'v2',
    artifactUri: null,
    externalRunId: null,
    metrics: { field_f1: 0.7 },
    lifecycle: 'registered',
    trainingSnapshotId: null,
    notes: null,
    createdAt: new Date(),
    promotedAt: null,
    ...partial,
  };
}

describe('SetMlModelVersionLifecycleUseCase canary gate', () => {
  it('fails version when metric drops too much', async () => {
    const registry: ModelRegistryRepository = {
      listFamilies: async () => [],
      findFamilyById: async () => null,
      listVersionsForFamily: async () => [],
      findVersionById: async (id) =>
        id === 'cand'
          ? version({ id: 'cand', familyId: 'heuristic-fields', metrics: { field_f1: 0.5 } })
          : null,
      getActiveVersionForFamily: async () =>
        version({
          id: 'base',
          familyId: 'heuristic-fields',
          lifecycle: 'active',
          metrics: { field_f1: 0.7 },
        }),
      setVersionLifecycle: async (_id, lifecycle) =>
        version({
          id: 'cand',
          familyId: 'heuristic-fields',
          lifecycle,
          metrics: { field_f1: 0.5 },
        }),
      archiveActiveForFamily: async () => {},
      insertCanaryEvaluation: async (row) => ({
        id: 'eval-1',
        evaluatedAt: new Date(),
        ...row,
      }),
      listRecentJobs: async () => [],
      createRetrainJob: async () => {
        throw new Error('not used');
      },
      updateRetrainJob: async () => {
        throw new Error('not used');
      },
      countCorrectionsSince: async () => 0,
      lastSnapshotWatermarkForFamily: async () => null,
      insertTrainingSnapshot: async () => ({ id: 'snap' }),
      registerModelVersion: async () => {
        throw new Error('not used');
      },
    };

    const useCase = new SetMlModelVersionLifecycleUseCase(registry);
    const result = await useCase.execute('cand', 'canary');
    expect(result.lifecycle).toBe('failed');
  });
});
