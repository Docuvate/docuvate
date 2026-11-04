// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
  FIELD_FEEDBACK_ANCHOR_READER,
} from '../../shared/domain/ports.js';
import { ListExtractionFieldCorrectionsUseCase } from './application/list-extraction-field-corrections.use-case.js';
import { RecordExtractionFieldCorrectionsUseCase } from './application/record-extraction-field-corrections.use-case.js';
import { ResolveConfirmationPositionsService } from './application/resolve-confirmation-positions.service.js';
import { PgExtractionFieldFeedbackRepository } from './infrastructure/pg-extraction-field-feedback.repository.js';
import { PgFieldFeedbackAnchorReader } from './infrastructure/pg-field-feedback-anchor.reader.js';
import { ExtractionFeedbackController } from './presentation/extraction-feedback.controller.js';

@Module({
  controllers: [ExtractionFeedbackController],
  providers: [
    {
      provide: EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
      useClass: PgExtractionFieldFeedbackRepository,
    },
    { provide: FIELD_FEEDBACK_ANCHOR_READER, useClass: PgFieldFeedbackAnchorReader },
    ResolveConfirmationPositionsService,
    RecordExtractionFieldCorrectionsUseCase,
    ListExtractionFieldCorrectionsUseCase,
  ],
  exports: [
    RecordExtractionFieldCorrectionsUseCase,
    ResolveConfirmationPositionsService,
    EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ExtractionFeedbackModule {}
