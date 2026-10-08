import { Module } from '@nestjs/common';
import { EXTRACTION_FIELD_FEEDBACK_REPOSITORY } from '../../shared/domain/ports.js';
import { PgExtractionFieldFeedbackRepository } from './infrastructure/pg-extraction-field-feedback.repository.js';
import { RecordExtractionFieldCorrectionsUseCase } from './application/record-extraction-field-corrections.use-case.js';
import { ListExtractionFieldCorrectionsUseCase } from './application/list-extraction-field-corrections.use-case.js';
import { ExtractionFeedbackController } from './presentation/extraction-feedback.controller.js';

@Module({
  controllers: [ExtractionFeedbackController],
  providers: [
    { provide: EXTRACTION_FIELD_FEEDBACK_REPOSITORY, useClass: PgExtractionFieldFeedbackRepository },
    RecordExtractionFieldCorrectionsUseCase,
    ListExtractionFieldCorrectionsUseCase,
  ],
  exports: [RecordExtractionFieldCorrectionsUseCase],
})
export class ExtractionFeedbackModule {}
