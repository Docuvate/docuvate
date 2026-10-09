// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  mlopsCanaryMaxMetricDrop,
  mlopsCanaryRequiredMetric,
} from '../../../shared/infrastructure/mlops/mlops-config.js';
import {
  MODEL_REGISTRY_REPOSITORY,
  type ModelRegistryRepository,
} from '../domain/model-registry.repository.port.js';
import type {
  MlModelFamilyEntity,
  MlModelLifecycle,
  MlModelVersionEntity,
  MlRetrainJobEntity,
  MlRetrainTriggerKind,
} from '../domain/model-registry.types.js';

@Injectable()
export class ListMlModelFamiliesUseCase {
  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository
  ) {}

  execute(): Promise<MlModelFamilyEntity[]> {
    return this.registry.listFamilies();
  }
}

@Injectable()
export class ListMlModelVersionsUseCase {
  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository
  ) {}

  async execute(familyId: string): Promise<MlModelVersionEntity[]> {
    const family = await this.registry.findFamilyById(familyId);
    if (!family) {
      throw new NotFoundError('Model family');
    }
    return this.registry.listVersionsForFamily(familyId);
  }
}

@Injectable()
export class ListMlRetrainJobsUseCase {
  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository
  ) {}

  async execute(familyId: string, limit = 20): Promise<MlRetrainJobEntity[]> {
    const family = await this.registry.findFamilyById(familyId);
    if (!family) {
      throw new NotFoundError('Model family');
    }
    return this.registry.listRecentJobs(familyId, limit);
  }
}

@Injectable()
export class SetMlModelVersionLifecycleUseCase {
  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository
  ) {}

  async execute(versionId: string, lifecycle: MlModelLifecycle): Promise<MlModelVersionEntity> {
    const version = await this.registry.findVersionById(versionId);
    if (!version) {
      throw new NotFoundError('Model version');
    }

    switch (lifecycle) {
      case 'canary':
        return this.promoteToCanary(version);
      case 'active':
        return this.promoteToActive(version);
      case 'archived':
        return this.registry.setVersionLifecycle(versionId, 'archived');
      case 'registered':
      case 'failed':
        return this.registry.setVersionLifecycle(versionId, lifecycle);
      default: {
        const _exhaustive: never = lifecycle;
        throw new ValidationError(`Unsupported lifecycle ${_exhaustive}`);
      }
    }
  }

  private async promoteToCanary(version: MlModelVersionEntity): Promise<MlModelVersionEntity> {
    if (version.lifecycle !== 'registered') {
      throw new ValidationError('Only registered versions enter canary');
    }
    const baseline = await this.registry.getActiveVersionForFamily(version.familyId);
    const metricName = mlopsCanaryRequiredMetric();
    const maxDrop = mlopsCanaryMaxMetricDrop();
    const baselineValue = baseline?.metrics[metricName] ?? null;
    const candidateValue = version.metrics[metricName] ?? null;

    let passed = true;
    if (baselineValue != null && candidateValue != null && baselineValue > 0) {
      const relativeDrop = (baselineValue - candidateValue) / baselineValue;
      passed = relativeDrop <= maxDrop;
    }

    await this.registry.insertCanaryEvaluation({
      versionId: version.id,
      baselineVersionId: baseline?.id ?? null,
      metricName,
      baselineValue,
      candidateValue,
      maxAllowedDrop: maxDrop,
      passed,
    });

    if (!passed) {
      return this.registry.setVersionLifecycle(version.id, 'failed');
    }
    return this.registry.setVersionLifecycle(version.id, 'canary');
  }

  private async promoteToActive(version: MlModelVersionEntity): Promise<MlModelVersionEntity> {
    if (version.lifecycle === 'archived') {
      await this.registry.archiveActiveForFamily(version.familyId, version.id);
      return this.registry.setVersionLifecycle(version.id, 'active');
    }
    if (version.lifecycle !== 'canary') {
      throw new ValidationError('Only canary or archived versions can become active');
    }
    await this.registry.archiveActiveForFamily(version.familyId, version.id);
    return this.registry.setVersionLifecycle(version.id, 'active');
  }
}

@Injectable()
export class TriggerMlRetrainUseCase {
  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository
  ) {}

  async execute(
    familyId: string,
    triggerKind: MlRetrainTriggerKind = 'manual'
  ): Promise<MlRetrainJobEntity> {
    const family = await this.registry.findFamilyById(familyId);
    if (!family) {
      throw new NotFoundError('Model family');
    }
    return this.registry.createRetrainJob(familyId, triggerKind);
  }
}

@Injectable()
export class EvaluateMlRetrainThresholdsUseCase {
  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository,
    private readonly triggerRetrain: TriggerMlRetrainUseCase
  ) {}

  async execute(familyIds: readonly string[], threshold: number): Promise<MlRetrainJobEntity[]> {
    const jobs: MlRetrainJobEntity[] = [];
    for (const familyId of familyIds) {
      const watermark = await this.registry.lastSnapshotWatermarkForFamily(familyId);
      const count = await this.registry.countCorrectionsSince(watermark);
      if (count < threshold) {
        continue;
      }
      const running = await this.registry.listRecentJobs(familyId, 1);
      const latest = running[0];
      if (latest && (latest.status === 'queued' || latest.status === 'running')) {
        continue;
      }
      jobs.push(await this.triggerRetrain.execute(familyId, 'threshold'));
    }
    return jobs;
  }
}
