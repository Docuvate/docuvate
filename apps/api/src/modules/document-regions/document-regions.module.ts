// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  DOCUMENT_PAGE_TRANSFORM_REPOSITORY,
  DOCUMENT_REGION_REPOSITORY,
} from '../../shared/domain/ports.js';
import { ExtractionFeedbackModule } from '../extraction-feedback/extraction-feedback.module.js';
import { ApplyFieldCorrectionUseCase } from './application/apply-field-correction.use-case.js';
import { ApplyPageTransformUseCase } from './application/apply-page-transform.use-case.js';
import { ApplyTableCorrectionUseCase } from './application/apply-table-correction.use-case.js';
import { ConfirmDocumentFieldUseCase } from './application/confirm-document-field.use-case.js';
import { ListDocumentRegionsUseCase } from './application/list-document-regions.use-case.js';
import { ListFieldSuggestionDecisionsUseCase } from './application/list-field-suggestion-decisions.use-case.js';
import { ListLayoutTokensUseCase } from './application/list-layout-tokens.use-case.js';
import { ListPageTransformsUseCase } from './application/list-page-transforms.use-case.js';
import { WithdrawFieldCorrectionUseCase } from './application/withdraw-field-correction.use-case.js';
import { WithdrawTableCorrectionUseCase } from './application/withdraw-table-correction.use-case.js';
import { PgDocumentPageTransformRepository } from './infrastructure/pg-document-page-transform.repository.js';
import { PgDocumentRegionRepository } from './infrastructure/pg-document-region.repository.js';
import { DocumentRegionsController } from './presentation/document-regions.controller.js';

@Module({
  imports: [ExtractionFeedbackModule],
  controllers: [DocumentRegionsController],
  providers: [
    { provide: DOCUMENT_REGION_REPOSITORY, useClass: PgDocumentRegionRepository },
    { provide: DOCUMENT_PAGE_TRANSFORM_REPOSITORY, useClass: PgDocumentPageTransformRepository },
    ListLayoutTokensUseCase,
    ListDocumentRegionsUseCase,
    ListPageTransformsUseCase,
    ListFieldSuggestionDecisionsUseCase,
    ApplyPageTransformUseCase,
    ApplyFieldCorrectionUseCase,
    WithdrawFieldCorrectionUseCase,
    ApplyTableCorrectionUseCase,
    WithdrawTableCorrectionUseCase,
    ConfirmDocumentFieldUseCase,
  ],
  exports: [DOCUMENT_REGION_REPOSITORY, DOCUMENT_PAGE_TRANSFORM_REPOSITORY],
})
export class DocumentRegionsModule {
  readonly feature = 'document-regions';
}
