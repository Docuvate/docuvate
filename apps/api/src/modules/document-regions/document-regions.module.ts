// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { DOCUMENT_REGION_REPOSITORY } from '../../shared/domain/ports.js';
import { ExtractionFeedbackModule } from '../extraction-feedback/extraction-feedback.module.js';
import { ApplyFieldCorrectionUseCase } from './application/apply-field-correction.use-case.js';
import { ApplyTableCorrectionUseCase } from './application/apply-table-correction.use-case.js';
import { ConfirmDocumentFieldUseCase } from './application/confirm-document-field.use-case.js';
import { ListDocumentRegionsUseCase } from './application/list-document-regions.use-case.js';
import { ListLayoutTokensUseCase } from './application/list-layout-tokens.use-case.js';
import { WithdrawFieldCorrectionUseCase } from './application/withdraw-field-correction.use-case.js';
import { WithdrawTableCorrectionUseCase } from './application/withdraw-table-correction.use-case.js';
import { PgDocumentRegionRepository } from './infrastructure/pg-document-region.repository.js';
import { DocumentRegionsController } from './presentation/document-regions.controller.js';

@Module({
  imports: [ExtractionFeedbackModule],
  controllers: [DocumentRegionsController],
  providers: [
    { provide: DOCUMENT_REGION_REPOSITORY, useClass: PgDocumentRegionRepository },
    ListLayoutTokensUseCase,
    ListDocumentRegionsUseCase,
    ApplyFieldCorrectionUseCase,
    WithdrawFieldCorrectionUseCase,
    ApplyTableCorrectionUseCase,
    WithdrawTableCorrectionUseCase,
    ConfirmDocumentFieldUseCase,
  ],
  exports: [DOCUMENT_REGION_REPOSITORY],
})
export class DocumentRegionsModule {
  readonly feature = 'document-regions';
}
