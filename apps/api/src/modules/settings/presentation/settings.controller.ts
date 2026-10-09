// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { HardwareCapabilitiesDto } from '@docuvate/contracts';
import {
  AuthGuard,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  DocumentChatProviderListResponseDto,
  ExtractionEngineListResponseDto,
  UpdateUserSettingsRequestDto,
  UserSettingsResponseDto,
} from '../../../shared/presentation/dtos/settings.dto.js';
import {
  GetUserSettingsUseCase,
  ListDocumentChatProvidersUseCase,
  ListExtractionEnginesUseCase,
  UpdateUserSettingsUseCase,
} from '../application/settings.use-cases.js';
import { EffectiveDocumentChatProviderUseCase } from '../application/effective-document-chat-provider.use-case.js';
import { GetHardwareCapabilitiesUseCase } from '../application/hardware-capabilities.use-case.js';

import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { toUserSettingsResponseDto } from '../application/user-settings-response.mapper.js';

@ApiDocuvateController('settings')
@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(
    private readonly getSettings: GetUserSettingsUseCase,
    private readonly updateSettings: UpdateUserSettingsUseCase,
    private readonly listEngines: ListExtractionEnginesUseCase,
    private readonly listChatProviders: ListDocumentChatProvidersUseCase,
    private readonly effectiveChatProvider: EffectiveDocumentChatProviderUseCase,
    private readonly hardwareCapabilities: GetHardwareCapabilitiesUseCase
  ) {}

  @Get()
  @ApiDocuvateRoute({ operationId: 'getUserSettings', summary: 'Get user settings' })
  async get(@Session() session: AuthSession): Promise<UserSettingsResponseDto> {
    await this.effectiveChatProvider.executeForUser(session.user.id, {
      persistUnavailablePreferenceClear: true,
    });
    const { row } = await this.getSettings.execute(session.user.id);
    const resolved = await this.effectiveChatProvider.resolveFromPreference(
      row.preferredChatProvider
    );
    return toUserSettingsResponseDto(row, resolved);
  }

  @Patch()
  @ApiDocuvateRoute({ operationId: 'updateUserSettings', summary: 'Update user settings' })
  async patch(
    @Session() session: AuthSession,
    @Body() body: UpdateUserSettingsRequestDto
  ): Promise<UserSettingsResponseDto> {
    const row = await this.updateSettings.execute(session.user.id, body);
    const resolved = await this.effectiveChatProvider.resolveFromPreference(
      row.preferredChatProvider
    );
    return toUserSettingsResponseDto(row, resolved);
  }

  @Get('chat-providers')
  @ApiDocuvateRoute({ operationId: 'listChatProviders', summary: 'List document chat providers' })
  async chatProviders(): Promise<DocumentChatProviderListResponseDto> {
    return this.listChatProviders.execute();
  }

  @Get('extraction-engines')
  @ApiDocuvateRoute({ operationId: 'listExtractionEngines', summary: 'List extraction engines' })
  async engines(): Promise<ExtractionEngineListResponseDto> {
    const engines = await this.listEngines.execute();
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
}
