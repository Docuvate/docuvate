import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { DocumentsEntity } from './documents.entity.js';
import { DocumentDuplicateStacksEntity } from './document-duplicate-stacks.entity.js';
import { UserEntity } from './user.entity.js';

@Index("document_stack_members_one_primary_idx", ["stackId"], { unique: true })
@Index("document_stack_members_stack_idx", ["stackId"], {})
@Entity("document_stack_members", { schema: "public" })
export class DocumentStackMembersEntity {
  @Column("uuid", { name: "stack_id" })
  stackId: string;

  @PrimaryColumn("uuid", { name: "document_id" })
  documentId: string;

  @Column("text", { name: "role" })
  role: string;

  @Column("timestamp with time zone", {
    name: "joined_at",
    default: () => "now()",
  })
  joinedAt: Date;

  @OneToOne(() => DocumentsEntity, (documents) => documents.documentStackMembers, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "document_id", referencedColumnName: "id" }])
  document: DocumentsEntity;

  @OneToOne(
    () => DocumentDuplicateStacksEntity,
    (documentDuplicateStacks) => documentDuplicateStacks.documentStackMembers,
    { onDelete: "CASCADE", createForeignKeyConstraints: false }
  )
  @JoinColumn([{ name: "stack_id", referencedColumnName: "id" }])
  stack: DocumentDuplicateStacksEntity;

  @ManyToOne(() => UserEntity, (user) => user.documentStackMembers, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;
}
