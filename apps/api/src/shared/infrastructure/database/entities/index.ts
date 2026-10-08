/** TypeORM persistence entities (infrastructure). Do not use in domain/application. */

import { AccountEntity } from './account.entity.js';
import { ChatMessagesEntity } from './chat-messages.entity.js';
import { ChatThreadDocumentsEntity } from './chat-thread-documents.entity.js';
import { ChatThreadsEntity } from './chat-threads.entity.js';
import { ConnectorInstallationsEntity } from './connector-installations.entity.js';
import { CorrespondentsEntity } from './correspondents.entity.js';
import { DocumentDuplicateCandidatesEntity } from './document-duplicate-candidates.entity.js';
import { DocumentDuplicateStacksEntity } from './document-duplicate-stacks.entity.js';
import { DocumentEmbeddingsEntity } from './document-embeddings.entity.js';
import { DocumentStackMembersEntity } from './document-stack-members.entity.js';
import { DocumentTagSuggestionsEntity } from './document-tag-suggestions.entity.js';
import { DocumentsEntity } from './documents.entity.js';
import { ExtractionArenaRatingsEntity } from './extraction-arena-ratings.entity.js';
import { ExtractionFieldCorrectionsEntity } from './extraction-field-corrections.entity.js';
import { FoldersEntity } from './folders.entity.js';
import { LabelRecommendationBlocklistEntity } from './label-recommendation-blocklist.entity.js';
import { LabelRecommendationBlocklistPatternsEntity } from './label-recommendation-blocklist-patterns.entity.js';
import { LabelRecommendationDismissalsEntity } from './label-recommendation-dismissals.entity.js';
import { MappenEntity } from './mappen.entity.js';
import { MlCanaryEvaluationsEntity } from './ml-canary-evaluations.entity.js';
import { MlModelFamiliesEntity } from './ml-model-families.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { MlRetrainJobsEntity } from './ml-retrain-jobs.entity.js';
import { MlTrainingDataSnapshotsEntity } from './ml-training-data-snapshots.entity.js';
import { RecognizedFieldDefinitionsEntity } from './recognized-field-definitions.entity.js';
import { SessionEntity } from './session.entity.js';
import { TagCustomFieldDefinitionsEntity } from './tag-custom-field-definitions.entity.js';
import { TagEmbeddingCentroidsEntity } from './tag-embedding-centroids.entity.js';
import { TagEmbeddingFeedbackEntity } from './tag-embedding-feedback.entity.js';
import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';
import { UserPreferencesEntity } from './user-preferences.entity.js';
import { VerificationEntity } from './verification.entity.js';

export const TYPEORM_ENTITIES = [
  AccountEntity,
  ChatMessagesEntity,
  ChatThreadDocumentsEntity,
  ChatThreadsEntity,
  ConnectorInstallationsEntity,
  CorrespondentsEntity,
  DocumentDuplicateCandidatesEntity,
  DocumentDuplicateStacksEntity,
  DocumentEmbeddingsEntity,
  DocumentStackMembersEntity,
  DocumentTagSuggestionsEntity,
  DocumentsEntity,
  ExtractionArenaRatingsEntity,
  ExtractionFieldCorrectionsEntity,
  FoldersEntity,
  LabelRecommendationBlocklistEntity,
  LabelRecommendationBlocklistPatternsEntity,
  LabelRecommendationDismissalsEntity,
  MappenEntity,
  MlCanaryEvaluationsEntity,
  MlModelFamiliesEntity,
  MlModelVersionsEntity,
  MlRetrainJobsEntity,
  MlTrainingDataSnapshotsEntity,
  RecognizedFieldDefinitionsEntity,
  SessionEntity,
  TagCustomFieldDefinitionsEntity,
  TagEmbeddingCentroidsEntity,
  TagEmbeddingFeedbackEntity,
  TagsEntity,
  UserEntity,
  UserPreferencesEntity,
  VerificationEntity,
] as const;

export {
  AccountEntity,
  ChatMessagesEntity,
  ChatThreadDocumentsEntity,
  ChatThreadsEntity,
  ConnectorInstallationsEntity,
  CorrespondentsEntity,
  DocumentDuplicateCandidatesEntity,
  DocumentDuplicateStacksEntity,
  DocumentEmbeddingsEntity,
  DocumentStackMembersEntity,
  DocumentTagSuggestionsEntity,
  DocumentsEntity,
  ExtractionArenaRatingsEntity,
  ExtractionFieldCorrectionsEntity,
  FoldersEntity,
  LabelRecommendationBlocklistEntity,
  LabelRecommendationBlocklistPatternsEntity,
  LabelRecommendationDismissalsEntity,
  MappenEntity,
  MlCanaryEvaluationsEntity,
  MlModelFamiliesEntity,
  MlModelVersionsEntity,
  MlRetrainJobsEntity,
  MlTrainingDataSnapshotsEntity,
  RecognizedFieldDefinitionsEntity,
  SessionEntity,
  TagCustomFieldDefinitionsEntity,
  TagEmbeddingCentroidsEntity,
  TagEmbeddingFeedbackEntity,
  TagsEntity,
  UserEntity,
  UserPreferencesEntity,
  VerificationEntity,
};
