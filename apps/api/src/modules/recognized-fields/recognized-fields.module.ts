// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { ExtractionFeedbackModule } from '../extraction-feedback/extraction-feedback.module.js';
import { SearchModule } from '../search/search.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ApplyGlobalRecognizedFieldsUseCase } from './application/apply-global-recognized-fields.use-case.js';
import { BackfillRecognizedFieldReextractionUseCase } from './application/backfill-recognized-field-reextraction.use-case.js';
import { ListRecognizedFieldAttemptsUseCase } from './application/list-recognized-field-attempts.use-case.js';
import {
  ListRecognizedFieldsUseCase,
  ReplaceRecognizedFieldsUseCase,
} from './application/recognized-field.use-cases.js';
import { ScheduleRecognizedFieldReextractionUseCase } from './application/schedule-recognized-field-reextraction.use-case.js';
import { PgRecognizedFieldExtractionAttemptRepository } from './infrastructure/pg-recognized-field-extraction-attempt.repository.js';
import { RecognizedFieldReextractBackfillService } from './infrastructure/recognized-field-reextract-backfill.service.js';
import { RecognizedFieldReextractQueueService } from './infrastructure/recognized-field-reextract-queue.service.js';
import { RecognizedFieldsController } from './presentation/recognized-fields.controller.js';

@Module({
  imports: [SettingsModule, SearchModule, ExtractionFeedbackModule],
  controllers: [RecognizedFieldsController],
  providers: [
    ListRecognizedFieldsUseCase,
    ReplaceRecognizedFieldsUseCase,
    ApplyGlobalRecognizedFieldsUseCase,
    ListRecognizedFieldAttemptsUseCase,
    ScheduleRecognizedFieldReextractionUseCase,
    BackfillRecognizedFieldReextractionUseCase,
    PgRecognizedFieldExtractionAttemptRepository,
    RecognizedFieldReextractQueueService,
    RecognizedFieldReextractBackfillService,
  ],
  exports: [
    ApplyGlobalRecognizedFieldsUseCase,
    ListRecognizedFieldAttemptsUseCase,
    ListRecognizedFieldsUseCase,
    ScheduleRecognizedFieldReextractionUseCase,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class RecognizedFieldsModule {}
