// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { HardwareCapabilitiesDto } from '@docuvate/contracts';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { EncoderReindexProgressDto } from '../../../shared/presentation/dtos/encoder-reindex.dto.js';
import {
  ExtractionEngineListResponseDto,
  UpdateUserSettingsRequestDto,
  UserSettingsResponseDto,
} from '../../../shared/presentation/dtos/settings.dto.js';
import {
  UpdateWorkspaceMlSettingsRequestDto,
  WorkspaceMlSettingsResponseDto,
} from '../../../shared/presentation/dtos/workspace-ml-settings.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { GetEncoderReindexProgressUseCase } from '../../representation/application/get-encoder-reindex-progress.use-case.js';
import { GetHardwareCapabilitiesUseCase } from '../application/hardware-capabilities.use-case.js';
import {
  GetUserSettingsUseCase,
  ListExtractionEnginesUseCase,
  UpdateUserSettingsUseCase,
} from '../application/settings.use-cases.js';
import { toUserSettingsResponseDto } from '../application/user-settings-response.mapper.js';
import {
  GetWorkspaceMlSettingsUseCase,
  UpdateWorkspaceMlSettingsUseCase,
} from '../application/workspace-ml-settings.use-cases.js';

@ApiDocuvateController('settings')
@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(
    private readonly getSettings: GetUserSettingsUseCase,
    private readonly updateSettings: UpdateUserSettingsUseCase,
    private readonly listEngines: ListExtractionEnginesUseCase,
    private readonly hardwareCapabilities: GetHardwareCapabilitiesUseCase,
    private readonly encoderReindexProgress: GetEncoderReindexProgressUseCase,
    private readonly getWorkspaceMl: GetWorkspaceMlSettingsUseCase,
    private readonly updateWorkspaceMl: UpdateWorkspaceMlSettingsUseCase
  ) {}

  @Get('workspace-ml')
  @ApiDocuvateRoute({
    operationId: 'getWorkspaceMlSettings',
    summary: 'Get workspace automation and recognition settings',
  })
  async workspaceMl(@Session() session: AuthSession): Promise<WorkspaceMlSettingsResponseDto> {
    return this.getWorkspaceMl.execute(session.user.id);
  }

  @Patch('workspace-ml')
  @ApiDocuvateRoute({
    operationId: 'updateWorkspaceMlSettings',
    summary: 'Update workspace automation and recognition settings (installation admins)',
  })
  async patchWorkspaceMl(
    @Session() session: AuthSession,
    @Body() body: UpdateWorkspaceMlSettingsRequestDto
  ): Promise<WorkspaceMlSettingsResponseDto> {
    return this.updateWorkspaceMl.execute(session.user.id, body);
  }

  @Get()
  @ApiDocuvateRoute({ operationId: 'getUserSettings', summary: 'Get user settings' })
  async get(@Session() session: AuthSession): Promise<UserSettingsResponseDto> {
    const { row } = await this.getSettings.execute(session.user.id);
    return toUserSettingsResponseDto(row);
  }

  @Patch()
  @ApiDocuvateRoute({ operationId: 'updateUserSettings', summary: 'Update user settings' })
  async patch(
    @Session() session: AuthSession,
    @Body() body: UpdateUserSettingsRequestDto
  ): Promise<UserSettingsResponseDto> {
    const row = await this.updateSettings.execute(session.user.id, body);
    return toUserSettingsResponseDto(row);
  }

  @Get('extraction-engines')
  @ApiDocuvateRoute({ operationId: 'listExtractionEngines', summary: 'List extraction engines' })
  async engines(@Session() session: AuthSession): Promise<ExtractionEngineListResponseDto> {
    const engines = await this.listEngines.execute(session.user.id);
    return { engines };
  }

  @Get('hardware')
  @ApiDocuvateRoute({
    operationId: 'getHardwareCapabilities',
    summary: 'Worker hardware capabilities',
  })
  async hardware(): Promise<HardwareCapabilitiesDto> {
    return this.hardwareCapabilities.execute();
  }

  @Get('encoder-reindex')
  @ApiDocuvateRoute({
    operationId: 'getEncoderReindexProgress',
    summary: 'Background document encoder re-index progress for the signed-in tenant',
  })
  async encoderReindex(@Session() session: AuthSession): Promise<EncoderReindexProgressDto> {
    return this.encoderReindexProgress.execute(session.user.id);
  }
}
