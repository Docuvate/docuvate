import { Column, Entity, Index, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { AccountEntity } from './account.entity.js';
import { ChatThreadDocumentsEntity } from './chat-thread-documents.entity.js';
import { ChatThreadsEntity } from './chat-threads.entity.js';
import { ConnectorInstallationsEntity } from './connector-installations.entity.js';
import { CorrespondentsEntity } from './correspondents.entity.js';
import { DocumentDuplicateCandidatesEntity } from './document-duplicate-candidates.entity.js';
import { DocumentDuplicateStacksEntity } from './document-duplicate-stacks.entity.js';
import { DocumentEmbeddingsEntity } from './document-embeddings.entity.js';
import { DocumentStackMembersEntity } from './document-stack-members.entity.js';
import { DocumentsEntity } from './documents.entity.js';
import { ExtractionArenaRatingsEntity } from './extraction-arena-ratings.entity.js';
import { ExtractionFieldCorrectionsEntity } from './extraction-field-corrections.entity.js';
import { FoldersEntity } from './folders.entity.js';
import { LabelRecommendationBlocklistEntity } from './label-recommendation-blocklist.entity.js';
import { LabelRecommendationBlocklistPatternsEntity } from './label-recommendation-blocklist-patterns.entity.js';
import { LabelRecommendationDismissalsEntity } from './label-recommendation-dismissals.entity.js';
import { MappenEntity } from './mappen.entity.js';
import { RecognizedFieldDefinitionsEntity } from './recognized-field-definitions.entity.js';
import { SessionEntity } from './session.entity.js';
import { TagCustomFieldDefinitionsEntity } from './tag-custom-field-definitions.entity.js';
import { TagEmbeddingCentroidsEntity } from './tag-embedding-centroids.entity.js';
import { TagEmbeddingFeedbackEntity } from './tag-embedding-feedback.entity.js';
import { TagsEntity } from './tags.entity.js';
import { UserPreferencesEntity } from './user-preferences.entity.js';

@Index("user_email_key", ["email"], { unique: true })
@Entity("user", { schema: "public" })
export class UserEntity {
  @PrimaryColumn("text", { name: "id" })
  id: string;

  @Column("text", { name: "name" })
  name: string;

  @Column("text", { name: "email", unique: true })
  email: string;

  @Column("boolean", { name: "emailVerified", default: () => "false" })
  emailVerified: boolean;

  @Column("text", { name: "image", nullable: true })
  image: string | null;

  @Column("timestamp with time zone", {
    name: "createdAt",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", {
    name: "updatedAt",
    default: () => "now()",
  })
  updatedAt: Date;

  @OneToMany(() => AccountEntity, (account) => account.user)
  accounts: AccountEntity[];

  @OneToMany(
    () => ChatThreadDocumentsEntity,
    (chatThreadDocuments) => chatThreadDocuments.user
  )
  chatThreadDocuments: ChatThreadDocumentsEntity[];

  @OneToMany(() => ChatThreadsEntity, (chatThreads) => chatThreads.user)
  chatThreads: ChatThreadsEntity[];

  @OneToMany(
    () => ConnectorInstallationsEntity,
    (connectorInstallations) => connectorInstallations.user
  )
  connectorInstallations: ConnectorInstallationsEntity[];

  @OneToMany(() => CorrespondentsEntity, (correspondents) => correspondents.user)
  correspondents: CorrespondentsEntity[];

  @OneToMany(
    () => DocumentDuplicateCandidatesEntity,
    (documentDuplicateCandidates) => documentDuplicateCandidates.user
  )
  documentDuplicateCandidates: DocumentDuplicateCandidatesEntity[];

  @OneToMany(
    () => DocumentDuplicateStacksEntity,
    (documentDuplicateStacks) => documentDuplicateStacks.user
  )
  documentDuplicateStacks: DocumentDuplicateStacksEntity[];

  @OneToMany(
    () => DocumentEmbeddingsEntity,
    (documentEmbeddings) => documentEmbeddings.user
  )
  documentEmbeddings: DocumentEmbeddingsEntity[];

  @OneToMany(
    () => DocumentStackMembersEntity,
    (documentStackMembers) => documentStackMembers.user
  )
  documentStackMembers: DocumentStackMembersEntity[];

  @OneToMany(() => DocumentsEntity, (documents) => documents.user)
  documents: DocumentsEntity[];

  @OneToMany(
    () => ExtractionArenaRatingsEntity,
    (extractionArenaRatings) => extractionArenaRatings.user
  )
  extractionArenaRatings: ExtractionArenaRatingsEntity[];

  @OneToMany(
    () => ExtractionFieldCorrectionsEntity,
    (extractionFieldCorrections) => extractionFieldCorrections.user
  )
  extractionFieldCorrections: ExtractionFieldCorrectionsEntity[];

  @OneToMany(() => FoldersEntity, (folders) => folders.user)
  folders: FoldersEntity[];

  @OneToMany(
    () => LabelRecommendationBlocklistEntity,
    (labelRecommendationBlocklist) => labelRecommendationBlocklist.user
  )
  labelRecommendationBlocklists: LabelRecommendationBlocklistEntity[];

  @OneToMany(
    () => LabelRecommendationBlocklistPatternsEntity,
    (labelRecommendationBlocklistPatterns) =>
      labelRecommendationBlocklistPatterns.user
  )
  labelRecommendationBlocklistPatterns: LabelRecommendationBlocklistPatternsEntity[];

  @OneToMany(
    () => LabelRecommendationDismissalsEntity,
    (labelRecommendationDismissals) => labelRecommendationDismissals.user
  )
  labelRecommendationDismissals: LabelRecommendationDismissalsEntity[];

  @OneToMany(() => MappenEntity, (mappen) => mappen.user)
  mappens: MappenEntity[];

  @OneToMany(
    () => RecognizedFieldDefinitionsEntity,
    (recognizedFieldDefinitions) => recognizedFieldDefinitions.user
  )
  recognizedFieldDefinitions: RecognizedFieldDefinitionsEntity[];

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions: SessionEntity[];

  @OneToMany(
    () => TagCustomFieldDefinitionsEntity,
    (tagCustomFieldDefinitions) => tagCustomFieldDefinitions.user
  )
  tagCustomFieldDefinitions: TagCustomFieldDefinitionsEntity[];

  @OneToMany(
    () => TagEmbeddingCentroidsEntity,
    (tagEmbeddingCentroids) => tagEmbeddingCentroids.user
  )
  tagEmbeddingCentroids: TagEmbeddingCentroidsEntity[];

  @OneToMany(
    () => TagEmbeddingFeedbackEntity,
    (tagEmbeddingFeedback) => tagEmbeddingFeedback.user
  )
  tagEmbeddingFeedbacks: TagEmbeddingFeedbackEntity[];

  @OneToOne(() => TagsEntity, (tags) => tags.user)
  tags: TagsEntity;

  @OneToOne(() => UserPreferencesEntity, (userPreferences) => userPreferences.user)
  userPreferences: UserPreferencesEntity;
}
