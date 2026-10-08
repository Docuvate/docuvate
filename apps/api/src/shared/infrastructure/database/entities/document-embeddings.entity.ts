import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { DocumentsEntity } from './documents.entity.js';
@Entity("document_embeddings", { schema: "public" })
export class DocumentEmbeddingsEntity {
  @PrimaryColumn("uuid", { name: "document_id" })
  documentId: string;

  @Column("text", { name: "model" })
  model: string;

  @Column("jsonb", { name: "embedding" })
  embedding: object;

  @Column("timestamp with time zone", {
    name: "updated_at",
    default: () => "now()",
  })
  updatedAt: Date;

  @OneToOne(() => DocumentsEntity, (documents) => documents.documentEmbeddings, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "document_id", referencedColumnName: "id" }])
  document: DocumentsEntity;
}
