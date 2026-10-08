import { Module } from '@nestjs/common';
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
import { RefreshEmbeddingSuggestionsUseCase } from './application/refresh-embedding-suggestions.use-case.js';
import { RecordEmbeddingFeedbackUseCase } from './application/embedding-feedback.use-case.js';
import { HttpEmbeddingAdapter } from './infrastructure/http-embedding.adapter.js';
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

@Module({
  imports: [DocumentChatModule, SettingsModule, RecognizedFieldsModule],
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
    RefreshEmbeddingSuggestionsUseCase,
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
