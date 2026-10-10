// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { USER_PREFERENCES_REPOSITORY } from '../../shared/domain/ports.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';
import { EffectiveDocumentChatProviderUseCase } from './application/effective-document-chat-provider.use-case.js';
import { GetHardwareCapabilitiesUseCase } from './application/hardware-capabilities.use-case.js';
import { ListDocumentChatProvidersUseCase } from './application/list-document-chat-providers.use-case.js';
import {
  GetUserSettingsUseCase,
  ListExtractionEnginesUseCase,
  RecordExtractionArenaRatingUseCase,
  ResolveUserExtractorEngineUseCase,
  UpdateUserSettingsUseCase,
} from './application/settings.use-cases.js';
import { PgUserPreferencesRepository } from './infrastructure/pg-user-preferences.repository.js';
import { SettingsController } from './presentation/settings.controller.js';

@Module({
  imports: [WorkspaceModule],
  controllers: [SettingsController],
  providers: [
    { provide: USER_PREFERENCES_REPOSITORY, useClass: PgUserPreferencesRepository },
    GetUserSettingsUseCase,
    UpdateUserSettingsUseCase,
    GetHardwareCapabilitiesUseCase,
    ListDocumentChatProvidersUseCase,
    ListExtractionEnginesUseCase,
    RecordExtractionArenaRatingUseCase,
    ResolveUserExtractorEngineUseCase,
    EffectiveDocumentChatProviderUseCase,
  ],
  exports: [
    USER_PREFERENCES_REPOSITORY,
    RecordExtractionArenaRatingUseCase,
    ResolveUserExtractorEngineUseCase,
    EffectiveDocumentChatProviderUseCase,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class SettingsModule {}
