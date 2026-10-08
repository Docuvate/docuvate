import { Module } from '@nestjs/common';
import { PgUserPreferencesRepository } from './infrastructure/pg-user-preferences.repository.js';
import { SettingsController } from './presentation/settings.controller.js';
import {
  GetUserSettingsUseCase,
  ListDocumentChatProvidersUseCase,
  ListExtractionEnginesUseCase,
  RecordExtractionArenaRatingUseCase,
  ResolveUserExtractorEngineUseCase,
  UpdateUserSettingsUseCase,
} from './application/settings.use-cases.js';
import { EffectiveDocumentChatProviderUseCase } from './application/effective-document-chat-provider.use-case.js';
import { GetHardwareCapabilitiesUseCase } from './application/hardware-capabilities.use-case.js';
import { USER_PREFERENCES_REPOSITORY } from '../../shared/domain/ports.js';

@Module({
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
export class SettingsModule {}
