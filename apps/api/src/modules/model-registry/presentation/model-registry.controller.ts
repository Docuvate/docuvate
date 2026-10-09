// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../shared/infrastructure/auth/auth.guard.js';
import { mlopsEnabled } from '../../../shared/infrastructure/mlops/mlops-config.js';
import {
  ListMlModelFamiliesUseCase,
  ListMlModelVersionsUseCase,
  ListMlRetrainJobsUseCase,
  SetMlModelVersionLifecycleUseCase,
  TriggerMlRetrainUseCase,
} from '../application/model-registry.use-cases.js';
import { MlRetrainQueueService } from '../infrastructure/ml-retrain-queue.service.js';
import {
  MlModelFamilyListResponseDto,
  MlModelVersionListResponseDto,
  MlRetrainJobListResponseDto,
  SetMlModelLifecycleRequestDto,
  TriggerMlRetrainRequestDto,
} from './model-registry.dto.js';
import { toFamilyDto, toJobDto, toVersionDto } from './model-registry.mapper.js';

import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('ml')
@Controller('ml')
@UseGuards(AuthGuard)
export class ModelRegistryController {
  constructor(
    private readonly listFamilies: ListMlModelFamiliesUseCase,
    private readonly listVersions: ListMlModelVersionsUseCase,
    private readonly listJobs: ListMlRetrainJobsUseCase,
    private readonly setLifecycle: SetMlModelVersionLifecycleUseCase,
    private readonly triggerRetrain: TriggerMlRetrainUseCase,
    private readonly retrainQueue: MlRetrainQueueService
  ) {}

  @Get('models/families')
  @ApiDocuvateRoute({ operationId: 'families', summary: 'families' })
  async families(): Promise<MlModelFamilyListResponseDto> {
    const families = await this.listFamilies.execute();
    return { families: families.map(toFamilyDto) };
  }

  @Get('models/families/:familyId/versions')
  @ApiDocuvateRoute({ operationId: 'versions', summary: 'versions' })
  async versions(@Param('familyId') familyId: string): Promise<MlModelVersionListResponseDto> {
    const versions = await this.listVersions.execute(familyId);
    return { versions: versions.map(toVersionDto) };
  }

  @Patch('models/versions/:versionId/lifecycle')
  @ApiDocuvateRoute({ operationId: 'patchLifecycle', summary: 'patchLifecycle' })
  async patchLifecycle(
    @Param('versionId') versionId: string,
    @Body() body: SetMlModelLifecycleRequestDto
  ): Promise<MlModelVersionListResponseDto> {
    const updated = await this.setLifecycle.execute(versionId, body.lifecycle);
    const versions = await this.listVersions.execute(updated.familyId);
    return { versions: versions.map(toVersionDto) };
  }

  @Get('retrain/jobs')
  @ApiDocuvateRoute({ operationId: 'jobs', summary: 'jobs' })
  async jobs(
    @Query('familyId') familyId: string,
    @Query('limit') limitRaw?: string
  ): Promise<MlRetrainJobListResponseDto> {
    const limit = limitRaw ? Math.min(Number(limitRaw) || 20, 100) : 20;
    const jobs = await this.listJobs.execute(familyId, limit);
    return { jobs: jobs.map(toJobDto) };
  }

  @Post('retrain')
  @ApiDocuvateRoute({ operationId: 'retrain', summary: 'retrain' })
  async retrain(@Body() body: TriggerMlRetrainRequestDto): Promise<MlRetrainJobListResponseDto> {
    const job = await this.triggerRetrain.execute(body.familyId, 'manual');
    if (mlopsEnabled()) {
      await this.retrainQueue.enqueueJob(job.id, job.familyId);
    }
    const jobs = await this.listJobs.execute(body.familyId, 10);
    return { jobs: jobs.map(toJobDto) };
  }
}
