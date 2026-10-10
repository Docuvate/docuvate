// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingDensityClassNiwEntity } from '../../shared/infrastructure/database/entities/embedding-density-class-niw.entity.js';
import { EmbeddingDensityCorrectionEntity } from '../../shared/infrastructure/database/entities/embedding-density-correction.entity.js';
import { EmbeddingDensityCorrectionOffsetEntity } from '../../shared/infrastructure/database/entities/embedding-density-correction-offset.entity.js';
import { EmbeddingDensityDecisionThresholdEntity } from '../../shared/infrastructure/database/entities/embedding-density-decision-threshold.entity.js';
import { EmbeddingDensityCalibrationRunEntity } from '../../shared/infrastructure/database/entities/embedding-density-calibration-run.entity.js';
import { EmbeddingDensityLabelGroupEntity } from '../../shared/infrastructure/database/entities/embedding-density-label-group.entity.js';
import { EmbeddingDensityLabelGroupMemberEntity } from '../../shared/infrastructure/database/entities/embedding-density-label-group-member.entity.js';
import { EmbeddingDensityUserStateEntity } from '../../shared/infrastructure/database/entities/embedding-density-user-state.entity.js';
import { DocumentEmbeddingsEntity } from '../../shared/infrastructure/database/entities/document-embeddings.entity.js';
import { TagsEntity } from '../../shared/infrastructure/database/entities/tags.entity.js';
import { DocumentChatModule } from '../../shared/infrastructure/chat/document-chat.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ApplyLabelMatchingUseCase } from './application/apply-label-matching.use-case.js';
import {
  AcceptTagSuggestionUseCase,
  AssignDocumentTagUseCase,
  DismissTagSuggestionUseCase,
  RemoveDocumentTagUseCase,
} from './application/document-label.use-cases.js';
import { LoadDocumentLabelSuggestionsUseCase } from './application/load-document-labels.use-case.js';
import { ApplyEmbeddingSuggestionsUseCase } from './application/apply-embedding-suggestions.use-case.js';
import { ApplyEmbeddingDensitySuggestionsUseCase } from './application/apply-embedding-density-suggestions.use-case.js';
import { RunEmbeddingDensityCalibrationUseCase } from './application/run-embedding-density-calibration.use-case.js';
import { RecordEmbeddingDensityCorrectionUseCase } from './application/record-embedding-density-correction.use-case.js';
import { RefreshEmbeddingSuggestionsUseCase } from './application/refresh-embedding-suggestions.use-case.js';
import { RecordEmbeddingFeedbackUseCase } from './application/embedding-feedback.use-case.js';
import { HttpEmbeddingAdapter } from './infrastructure/http-embedding.adapter.js';
import { HttpEmbeddingDensityAdapter } from './infrastructure/http-embedding-density.adapter.js';
import { PgEmbeddingDensityRepository } from './infrastructure/pg-embedding-density.repository.js';
import { PgLabelEmbeddingRepository } from './infrastructure/pg-label-embedding.repository.js';
import { DocumentLabelsController } from './presentation/document-labels.controller.js';
import { LabelsOverviewController } from './presentation/labels-overview.controller.js';
import { TagCustomFieldsController } from './presentation/tag-custom-fields.controller.js';
import {
  ListTagCustomFieldsUseCase,
  ReplaceTagCustomFieldsUseCase,
} from './application/tag-custom-field.use-cases.js';
import { ApplyLabelCustomFieldsUseCase } from './application/apply-label-custom-fields.use-case.js';
import { GetLabelRecommendationsUseCase } from './application/get-label-recommendations.use-case.js';
import { GetLabelMapUseCase } from './application/get-label-map.use-case.js';
import { BackfillDocumentEmbeddingsUseCase } from './application/backfill-document-embeddings.use-case.js';
import {
  AcceptLabelRecommendationUseCase,
  DismissLabelRecommendationUseCase,
} from './application/label-recommendation-actions.use-case.js';
import {
  ConfirmBlocklistPatternUseCase,
  ProposeBlocklistPatternUseCase,
  RemoveBlocklistPatternUseCase,
} from './application/blocklist-pattern.use-case.js';
import {
  AddRecommendationBlocklistUseCase,
  ListRecommendationBlocklistUseCase,
  RemoveRecommendationBlocklistUseCase,
} from './application/recommendation-blocklist.use-case.js';
import { EMBEDDING_PORT, LABEL_EMBEDDING_REPOSITORY } from '../../shared/domain/ports.js';
import { RecognizedFieldsModule } from '../recognized-fields/recognized-fields.module.js';
import {
  isOpenApiContractTestMode,
  isOpenApiHeadlessMode,
} from '../../shared/infrastructure/database/typeorm-options.js';
import { HeadlessPgEmbeddingDensityRepository } from './infrastructure/headless-pg-embedding-density.repository.js';
import { EmbeddingDensityCalibrationQueueService } from './infrastructure/embedding-density-calibration-queue.service.js';

const skipEmbeddingDensityTypeOrm =
  isOpenApiHeadlessMode() || isOpenApiContractTestMode();

const embeddingDensityTypeOrmImports = skipEmbeddingDensityTypeOrm
  ? []
  : [
      TypeOrmModule.forFeature([
        EmbeddingDensityUserStateEntity,
        EmbeddingDensityClassNiwEntity,
        EmbeddingDensityDecisionThresholdEntity,
        EmbeddingDensityCalibrationRunEntity,
        EmbeddingDensityLabelGroupEntity,
        EmbeddingDensityLabelGroupMemberEntity,
        EmbeddingDensityCorrectionEntity,
        EmbeddingDensityCorrectionOffsetEntity,
        DocumentEmbeddingsEntity,
        TagsEntity,
      ]),
    ];

@Module({
  imports: [
    DocumentChatModule,
    SettingsModule,
    RecognizedFieldsModule,
    ...embeddingDensityTypeOrmImports,
  ],
  controllers: [DocumentLabelsController, LabelsOverviewController, TagCustomFieldsController],
  providers: [
    ListTagCustomFieldsUseCase,
    ReplaceTagCustomFieldsUseCase,
    ApplyLabelCustomFieldsUseCase,
    GetLabelRecommendationsUseCase,
    GetLabelMapUseCase,
    BackfillDocumentEmbeddingsUseCase,
    AcceptLabelRecommendationUseCase,
    DismissLabelRecommendationUseCase,
    ListRecommendationBlocklistUseCase,
    AddRecommendationBlocklistUseCase,
    RemoveRecommendationBlocklistUseCase,
    ProposeBlocklistPatternUseCase,
    ConfirmBlocklistPatternUseCase,
    RemoveBlocklistPatternUseCase,
    ApplyLabelMatchingUseCase,
    ApplyEmbeddingSuggestionsUseCase,
    ApplyEmbeddingDensitySuggestionsUseCase,
    RunEmbeddingDensityCalibrationUseCase,
    EmbeddingDensityCalibrationQueueService,
    RecordEmbeddingDensityCorrectionUseCase,
    RefreshEmbeddingSuggestionsUseCase,
    HttpEmbeddingDensityAdapter,
    ...(skipEmbeddingDensityTypeOrm
      ? [
          {
            provide: PgEmbeddingDensityRepository,
            useClass: HeadlessPgEmbeddingDensityRepository,
          },
        ]
      : [PgEmbeddingDensityRepository]),
    RecordEmbeddingFeedbackUseCase,
    LoadDocumentLabelSuggestionsUseCase,
    AssignDocumentTagUseCase,
    RemoveDocumentTagUseCase,
    AcceptTagSuggestionUseCase,
    DismissTagSuggestionUseCase,
    { provide: EMBEDDING_PORT, useClass: HttpEmbeddingAdapter },
    { provide: LABEL_EMBEDDING_REPOSITORY, useClass: PgLabelEmbeddingRepository },
  ],
  exports: [
    ApplyLabelMatchingUseCase,
    ApplyEmbeddingSuggestionsUseCase,
    RefreshEmbeddingSuggestionsUseCase,
    LoadDocumentLabelSuggestionsUseCase,
    LABEL_EMBEDDING_REPOSITORY,
    EMBEDDING_PORT,
  ],
})
export class LabelsModule {}
