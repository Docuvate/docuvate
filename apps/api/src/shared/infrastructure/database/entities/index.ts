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
import { DocumentLayoutIrEntity } from './document-layout-ir.entity.js';
import { DocumentLayoutIrPagesEntity } from './document-layout-ir-pages.entity.js';
import { DocumentExtractionBlocksEntity } from './document-extraction-blocks.entity.js';
import { DocumentFieldValuesEntity } from './document-field-values.entity.js';
import { DocumentTextChunksEntity } from './document-text-chunks.entity.js';
import { DocumentStackMembersEntity } from './document-stack-members.entity.js';
import { DocumentTagSuggestionsEntity } from './document-tag-suggestions.entity.js';
import { DocumentsEntity } from './documents.entity.js';
import { ExtractionArenaRatingComparedEnginesEntity } from './extraction-arena-rating-compared-engines.entity.js';
import { ExtractionArenaRatingsEntity } from './extraction-arena-ratings.entity.js';
import { ExtractionFieldCorrectionLabelsEntity } from './extraction-field-correction-labels.entity.js';
import { ExtractionFieldCorrectionsEntity } from './extraction-field-corrections.entity.js';
import { DashboardWidgetsEntity } from './dashboard-widgets.entity.js';
import { FoldersEntity } from './folders.entity.js';
import { InstallationDashboardWidgetsEntity } from './installation-dashboard-widgets.entity.js';
import { InstallationUserRolesEntity } from './installation-user-roles.entity.js';
import { InstallationUserSuspensionsEntity } from './installation-user-suspensions.entity.js';
import { LabelRecommendationBlocklistEntity } from './label-recommendation-blocklist.entity.js';
import { LabelRecommendationBlocklistPatternsEntity } from './label-recommendation-blocklist-patterns.entity.js';
import { LabelRecommendationDismissalsEntity } from './label-recommendation-dismissals.entity.js';
import { MappenEntity } from './mappen.entity.js';
import { PasskeyEntity } from './passkey.entity.js';
import { MlCanaryEvaluationsEntity } from './ml-canary-evaluations.entity.js';
import { MlModelFamiliesEntity } from './ml-model-families.entity.js';
import { MlModelVersionsEntity } from './ml-model-versions.entity.js';
import { MlRetrainJobsEntity } from './ml-retrain-jobs.entity.js';
import { MlTrainingDataSnapshotsEntity } from './ml-training-data-snapshots.entity.js';
import { RecognizedFieldDefinitionGateLabelsEntity } from './recognized-field-definition-gate-labels.entity.js';
import { RecognizedFieldDefinitionsEntity } from './recognized-field-definitions.entity.js';
import { SavedDocumentViewTagsEntity } from './saved-document-view-tags.entity.js';
import { SavedDocumentViewsEntity } from './saved-document-views.entity.js';
import { SearchVocabularyTermsEntity } from './search-vocabulary-terms.entity.js';
import { SftpIngressAccountLabelsEntity } from './sftp-ingress-account-labels.entity.js';
import { SftpIngressAccountsEntity } from './sftp-ingress-accounts.entity.js';
import { SftpIngressAuditEntity } from './sftp-ingress-audit.entity.js';
import { SftpIngressEventsEntity } from './sftp-ingress-events.entity.js';
import { SftpPullSyncStateEntity } from './sftp-pull-sync-state.entity.js';
import { SessionEntity } from './session.entity.js';
import { TenantsEntity } from './tenants.entity.js';
import { TwoFactorEntity } from './two-factor.entity.js';
import { TagCustomFieldDefinitionsEntity } from './tag-custom-field-definitions.entity.js';
import { TagEmbeddingCentroidsEntity } from './tag-embedding-centroids.entity.js';
import { TagEmbeddingFeedbackEntity } from './tag-embedding-feedback.entity.js';
import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';
import { UserInvitationsEntity } from './user-invitations.entity.js';
import { UserPreferenceRequiredLabelsEntity } from './user-preference-required-labels.entity.js';
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
  DocumentExtractionBlocksEntity,
  DocumentFieldValuesEntity,
  DocumentLayoutIrEntity,
  DocumentLayoutIrPagesEntity,
  DocumentTextChunksEntity,
  DocumentStackMembersEntity,
  DocumentTagSuggestionsEntity,
  DocumentsEntity,
  ExtractionArenaRatingComparedEnginesEntity,
  ExtractionArenaRatingsEntity,
  ExtractionFieldCorrectionLabelsEntity,
  ExtractionFieldCorrectionsEntity,
  DashboardWidgetsEntity,
  FoldersEntity,
  InstallationDashboardWidgetsEntity,
  InstallationUserRolesEntity,
  InstallationUserSuspensionsEntity,
  LabelRecommendationBlocklistEntity,
  LabelRecommendationBlocklistPatternsEntity,
  LabelRecommendationDismissalsEntity,
  MappenEntity,
  PasskeyEntity,
  MlCanaryEvaluationsEntity,
  MlModelFamiliesEntity,
  MlModelVersionsEntity,
  MlRetrainJobsEntity,
  MlTrainingDataSnapshotsEntity,
  RecognizedFieldDefinitionGateLabelsEntity,
  RecognizedFieldDefinitionsEntity,
  SavedDocumentViewTagsEntity,
  SavedDocumentViewsEntity,
  SearchVocabularyTermsEntity,
  SftpIngressAccountLabelsEntity,
  SftpIngressAccountsEntity,
  SftpIngressAuditEntity,
  SftpIngressEventsEntity,
  SftpPullSyncStateEntity,
  SessionEntity,
  TenantsEntity,
  TwoFactorEntity,
  TagCustomFieldDefinitionsEntity,
  TagEmbeddingCentroidsEntity,
  TagEmbeddingFeedbackEntity,
  TagsEntity,
  UserEntity,
  UserInvitationsEntity,
  UserPreferenceRequiredLabelsEntity,
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
  DocumentExtractionBlocksEntity,
  DocumentFieldValuesEntity,
  DocumentLayoutIrEntity,
  DocumentLayoutIrPagesEntity,
  DocumentTextChunksEntity,
  DocumentStackMembersEntity,
  DocumentTagSuggestionsEntity,
  DocumentsEntity,
  ExtractionArenaRatingComparedEnginesEntity,
  ExtractionArenaRatingsEntity,
  ExtractionFieldCorrectionLabelsEntity,
  ExtractionFieldCorrectionsEntity,
  DashboardWidgetsEntity,
  FoldersEntity,
  InstallationDashboardWidgetsEntity,
  InstallationUserRolesEntity,
  InstallationUserSuspensionsEntity,
  LabelRecommendationBlocklistEntity,
  LabelRecommendationBlocklistPatternsEntity,
  LabelRecommendationDismissalsEntity,
  MappenEntity,
  PasskeyEntity,
  MlCanaryEvaluationsEntity,
  MlModelFamiliesEntity,
  MlModelVersionsEntity,
  MlRetrainJobsEntity,
  MlTrainingDataSnapshotsEntity,
  RecognizedFieldDefinitionGateLabelsEntity,
  RecognizedFieldDefinitionsEntity,
  SavedDocumentViewTagsEntity,
  SavedDocumentViewsEntity,
  SearchVocabularyTermsEntity,
  SftpIngressAccountLabelsEntity,
  SftpIngressAccountsEntity,
  SftpIngressAuditEntity,
  SftpIngressEventsEntity,
  SftpPullSyncStateEntity,
  SessionEntity,
  TenantsEntity,
  TwoFactorEntity,
  TagCustomFieldDefinitionsEntity,
  TagEmbeddingCentroidsEntity,
  TagEmbeddingFeedbackEntity,
  TagsEntity,
  UserEntity,
  UserInvitationsEntity,
  UserPreferenceRequiredLabelsEntity,
  UserPreferencesEntity,
  VerificationEntity,
};
