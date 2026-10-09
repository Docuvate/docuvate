// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { MODEL_REGISTRY_REPOSITORY } from './domain/model-registry.repository.port.js';
import {
  EvaluateMlRetrainThresholdsUseCase,
  ListMlModelFamiliesUseCase,
  ListMlModelVersionsUseCase,
  ListMlRetrainJobsUseCase,
  SetMlModelVersionLifecycleUseCase,
  TriggerMlRetrainUseCase,
} from './application/model-registry.use-cases.js';
import { PgModelRegistryRepository } from './infrastructure/pg-model-registry.repository.js';
import { HttpMlRetrainAdapter } from './infrastructure/http-ml-retrain.adapter.js';
import { MlRetrainQueueService } from './infrastructure/ml-retrain-queue.service.js';
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
export class ModelRegistryModule {}
