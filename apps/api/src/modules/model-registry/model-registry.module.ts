// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  EvaluateMlRetrainThresholdsUseCase,
  ListMlModelFamiliesUseCase,
  ListMlModelVersionsUseCase,
  ListMlRetrainJobsUseCase,
  SetMlModelVersionLifecycleUseCase,
  TriggerMlRetrainUseCase,
} from './application/model-registry.use-cases.js';
import { MODEL_REGISTRY_REPOSITORY } from './domain/model-registry.repository.port.js';
import { HttpMlRetrainAdapter } from './infrastructure/http-ml-retrain.adapter.js';
import { MlRetrainQueueService } from './infrastructure/ml-retrain-queue.service.js';
import { PgModelRegistryRepository } from './infrastructure/pg-model-registry.repository.js';
import { ModelRegistryController } from './presentation/model-registry.controller.js';

@Module({
  controllers: [ModelRegistryController],
  providers: [
    { provide: MODEL_REGISTRY_REPOSITORY, useClass: PgModelRegistryRepository },
    ListMlModelFamiliesUseCase,
    ListMlModelVersionsUseCase,
    ListMlRetrainJobsUseCase,
    SetMlModelVersionLifecycleUseCase,
    TriggerMlRetrainUseCase,
    EvaluateMlRetrainThresholdsUseCase,
    HttpMlRetrainAdapter,
    MlRetrainQueueService,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ModelRegistryModule {}
