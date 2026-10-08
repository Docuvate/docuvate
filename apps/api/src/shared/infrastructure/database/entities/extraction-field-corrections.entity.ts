import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DocumentsEntity } from './documents.entity.js';
import { TagsEntity } from './tags.entity.js';
import { UserEntity } from './user.entity.js';

@Index(
  "extraction_field_corrections_user_created_idx",
  ["createdAt", "userId"],
  {}
)
@Index(
  "extraction_field_corrections_document_idx",
  ["createdAt", "documentId"],
  {}
)
@Entity("extraction_field_corrections", { schema: "public" })
export class ExtractionFieldCorrectionsEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string;

  @Column("text", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "document_id" })
  documentId: string;

  @Column("text", { name: "field_key" })
  fieldKey: string;

  @Column("text", { name: "old_value", default: () => "''" })
  oldValue: string;

  @Column("text", { name: "new_value", default: () => "''" })
  newValue: string;

  @Column("jsonb", { name: "label_tag_ids", default: [] })
  labelTagIds: object;

  @Column("text", { name: "source", default: () => "'user_correction'" })
  source: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(
    () => DocumentsEntity,
    (documents) => documents.extractionFieldCorrections,
    { onDelete: "CASCADE", createForeignKeyConstraints: false }
  )
  @JoinColumn([{ name: "document_id", referencedColumnName: "id" }])
  document: DocumentsEntity;

  @ManyToOne(() => TagsEntity, (tags) => tags.extractionFieldCorrections, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "field_tag_id", referencedColumnName: "id" }])
  fieldTag: TagsEntity;

  @ManyToOne(() => UserEntity, (user) => user.extractionFieldCorrections, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;
}
