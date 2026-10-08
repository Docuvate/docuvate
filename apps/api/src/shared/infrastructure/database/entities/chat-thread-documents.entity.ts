import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { DocumentsEntity } from './documents.entity.js';
import { ChatThreadsEntity } from './chat-threads.entity.js';
import { UserEntity } from './user.entity.js';

@Index("chat_thread_documents_document_idx", ["documentId", "userId"], {})
@Entity("chat_thread_documents", { schema: "public" })
export class ChatThreadDocumentsEntity {
  @PrimaryColumn("uuid", { name: "thread_id" })
  threadId: string;

  @PrimaryColumn("uuid", { name: "document_id" })
  documentId: string;

  @Column("text", { name: "user_id" })
  userId: string;

  @Column("timestamp with time zone", {
    name: "linked_at",
    default: () => "now()",
  })
  linkedAt: Date;

  @ManyToOne(() => DocumentsEntity, (documents) => documents.chatThreadDocuments, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "document_id", referencedColumnName: "id" }])
  document: DocumentsEntity;

  @ManyToOne(
    () => ChatThreadsEntity,
    (chatThreads) => chatThreads.chatThreadDocuments,
    { onDelete: "CASCADE", createForeignKeyConstraints: false }
  )
  @JoinColumn([{ name: "thread_id", referencedColumnName: "id" }])
  thread: ChatThreadsEntity;

  @ManyToOne(() => UserEntity, (user) => user.chatThreadDocuments, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;
}
