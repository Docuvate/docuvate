// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { EXTRACTION_FIELD_FEEDBACK_REPOSITORY } from '../../shared/domain/ports.js';
import { ListExtractionFieldCorrectionsUseCase } from './application/list-extraction-field-corrections.use-case.js';
import { RecordExtractionFieldCorrectionsUseCase } from './application/record-extraction-field-corrections.use-case.js';
import { PgExtractionFieldFeedbackRepository } from './infrastructure/pg-extraction-field-feedback.repository.js';
import { ExtractionFeedbackController } from './presentation/extraction-feedback.controller.js';

@Module({
  controllers: [ExtractionFeedbackController],
  providers: [
    {
      provide: EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
      useClass: PgExtractionFieldFeedbackRepository,
    },
    RecordExtractionFieldCorrectionsUseCase,
    ListExtractionFieldCorrectionsUseCase,
  ],
  exports: [RecordExtractionFieldCorrectionsUseCase],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ExtractionFeedbackModule {}
