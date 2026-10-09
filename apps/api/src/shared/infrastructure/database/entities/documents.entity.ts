import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { ChatThreadDocumentsEntity } from './chat-thread-documents.entity.js';
import { DocumentDuplicateCandidatesEntity } from './document-duplicate-candidates.entity.js';
import { DocumentEmbeddingsEntity } from './document-embeddings.entity.js';
import { DocumentStackMembersEntity } from './document-stack-members.entity.js';
import { DocumentTagSuggestionsEntity } from './document-tag-suggestions.entity.js';
import { TagsEntity } from './tags.entity.js';
import { CorrespondentsEntity } from './correspondents.entity.js';
import { FoldersEntity } from './folders.entity.js';
import { MappenEntity } from './mappen.entity.js';
import { UserEntity } from './user.entity.js';
import { ExtractionArenaRatingsEntity } from './extraction-arena-ratings.entity.js';
import { ExtractionFieldCorrectionsEntity } from './extraction-field-corrections.entity.js';
import { TagEmbeddingFeedbackEntity } from './tag-embedding-feedback.entity.js';
import { DocumentLayoutIrEntity } from './document-layout-ir.entity.js';

@Index("documents_content_hash_idx", ["contentHash", "userId"], {})
@Index("documents_folder_id_idx", ["folderId"], {})
@Index("documents_mappe_id_idx", ["mappeId"], {})
@Index("documents_search_idx", ["searchVector"], {})
@Index("documents_user_id_idx", ["userId"], {})
@Entity("documents", { schema: "public" })
export class DocumentsEntity {
  @PrimaryColumn("uuid", { name: "id" })
  id: string;

  @Column("text", { name: "user_id" })
  userId: string;

  @Column("text", { name: "filename" })
  filename: string;

  @Column("text", { name: "mime_type" })
  mimeType: string;

  @Column("text", { name: "storage_key" })
  storageKey: string;

  @Column("text", { name: "status" })
  status: string;

  @Column("text", { name: "extracted_text", nullable: true })
  extractedText: string | null;

  @Column("tsvector", { name: "search_vector", nullable: true })
  searchVector: string | null;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("timestamp with time zone", {
    name: "updated_at",
    default: () => "now()",
  })
  updatedAt: Date;

  @Column("text", { name: "title", nullable: true, default: () => "''" })
  title: string | null;

  @Column("date", { name: "document_date", nullable: true })
  documentDate: string | null;

  @Column("text", { name: "notes", nullable: true })
  notes: string | null;

  @Column("uuid", { name: "folder_id", nullable: true })
  folderId: string | null;

  @Column("text", { name: "content_hash", nullable: true })
  contentHash: string | null;

  @Column("text", { name: "extracted_markdown", nullable: true })
  extractedMarkdown: string | null;

  @Column("uuid", { name: "mappe_id", nullable: true })
  mappeId: string | null;

  @Column("text", { name: "ingest_source", nullable: true })
  ingestSource: string | null;

  @OneToMany(
    () => ChatThreadDocumentsEntity,
    (chatThreadDocuments) => chatThreadDocuments.document
  )
  chatThreadDocuments: ChatThreadDocumentsEntity[];

  @OneToMany(
    () => DocumentDuplicateCandidatesEntity,
    (documentDuplicateCandidates) =>
      documentDuplicateCandidates.candidateDocument
  )
  documentDuplicateCandidates: DocumentDuplicateCandidatesEntity[];

  @OneToMany(
    () => DocumentDuplicateCandidatesEntity,
    (documentDuplicateCandidates) => documentDuplicateCandidates.document
  )
  documentDuplicateCandidates2: DocumentDuplicateCandidatesEntity[];

  @OneToOne(() => DocumentLayoutIrEntity, (layoutIr) => layoutIr.document)
  layoutIr: DocumentLayoutIrEntity;

  @OneToOne(
    () => DocumentEmbeddingsEntity,
    (documentEmbeddings) => documentEmbeddings.document
  )
  documentEmbeddings: DocumentEmbeddingsEntity;

  @OneToOne(
    () => DocumentStackMembersEntity,
    (documentStackMembers) => documentStackMembers.document
  )
  documentStackMembers: DocumentStackMembersEntity;

  @OneToMany(
    () => DocumentTagSuggestionsEntity,
    (documentTagSuggestions) => documentTagSuggestions.document
  )
  documentTagSuggestions: DocumentTagSuggestionsEntity[];

  @ManyToMany(() => TagsEntity, (tags) => tags.documents)
  @JoinTable({
    name: "document_tags",
    joinColumns: [{ name: "document_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "tag_id", referencedColumnName: "id" }],
    schema: "public",
  })
  tags: TagsEntity[];

  @ManyToOne(
    () => CorrespondentsEntity,
    (correspondents) => correspondents.documents,
    { onDelete: "SET NULL", createForeignKeyConstraints: false }
  )
  @JoinColumn([{ name: "correspondent_id", referencedColumnName: "id" }])
  correspondent: CorrespondentsEntity;

  @ManyToOne(() => FoldersEntity, (folders) => folders.documents, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "folder_id", referencedColumnName: "id" }])
  folder: FoldersEntity;

  @ManyToOne(() => MappenEntity, (mappen) => mappen.documents, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "mappe_id", referencedColumnName: "id" }])
  mappe: MappenEntity;

  @ManyToOne(() => UserEntity, (user) => user.documents, { onDelete: "CASCADE", createForeignKeyConstraints: false })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;

  @OneToMany(
    () => ExtractionArenaRatingsEntity,
    (extractionArenaRatings) => extractionArenaRatings.document
  )
  extractionArenaRatings: ExtractionArenaRatingsEntity[];

  @OneToMany(
    () => ExtractionFieldCorrectionsEntity,
    (extractionFieldCorrections) => extractionFieldCorrections.document
  )
  extractionFieldCorrections: ExtractionFieldCorrectionsEntity[];

  @OneToMany(
    () => TagEmbeddingFeedbackEntity,
    (tagEmbeddingFeedback) => tagEmbeddingFeedback.document
  )
  tagEmbeddingFeedbacks: TagEmbeddingFeedbackEntity[];
}
