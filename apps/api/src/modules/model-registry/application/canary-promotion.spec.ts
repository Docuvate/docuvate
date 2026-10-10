// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { ModelRegistryRepository } from '../domain/model-registry.repository.port.js';
import type { MlModelVersionEntity } from '../domain/model-registry.types.js';
import { SetMlModelVersionLifecycleUseCase } from './model-registry.use-cases.js';

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
      listFamilies: () => Promise.resolve([]),
      findFamilyById: () => Promise.resolve(null),
      listVersionsForFamily: () => Promise.resolve([]),
      findVersionById: (id) =>
        Promise.resolve(
          id === 'cand'
            ? version({ id: 'cand', familyId: 'heuristic-fields', metrics: { field_f1: 0.5 } })
            : null
        ),
      getActiveVersionForFamily: () =>
        Promise.resolve(
          version({
            id: 'base',
            familyId: 'heuristic-fields',
            lifecycle: 'active',
            metrics: { field_f1: 0.7 },
          })
        ),
      setVersionLifecycle: (_id, lifecycle) =>
        Promise.resolve(
          version({
            id: 'cand',
            familyId: 'heuristic-fields',
            lifecycle,
            metrics: { field_f1: 0.5 },
          })
        ),
      archiveActiveForFamily: () => Promise.resolve(),
      insertCanaryEvaluation: (row) =>
        Promise.resolve({
          id: 'eval-1',
          evaluatedAt: new Date(),
          ...row,
        }),
      listRecentJobs: () => Promise.resolve([]),
      createRetrainJob: () => Promise.reject(new Error('not used')),
      updateRetrainJob: () => Promise.reject(new Error('not used')),
      countCorrectionsSince: () => Promise.resolve(0),
      lastSnapshotWatermarkForFamily: () => Promise.resolve(null),
      insertTrainingSnapshot: () => Promise.resolve({ id: 'snap' }),
      registerModelVersion: () => Promise.reject(new Error('not used')),
    };

    const useCase = new SetMlModelVersionLifecycleUseCase(registry);
    const result = await useCase.execute('cand', 'canary');
    expect(result.lifecycle).toBe('failed');
  });
});
