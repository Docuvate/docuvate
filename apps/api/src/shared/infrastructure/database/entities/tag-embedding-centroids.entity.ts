import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { TagsEntity } from './tags.entity.js';
@Entity("tag_embedding_centroids", { schema: "public" })
export class TagEmbeddingCentroidsEntity {
  @PrimaryColumn("uuid", { name: "tag_id" })
  tagId: string;

  @Column("text", { name: "model" })
  model: string;

  @Column("integer", { name: "sample_count", default: () => "0" })
  sampleCount: number;

  @Column("jsonb", { name: "centroid" })
  centroid: object;

  @Column("timestamp with time zone", {
    name: "updated_at",
    default: () => "now()",
  })
  updatedAt: Date;

  @OneToOne(() => TagsEntity, (tags) => tags.tagEmbeddingCentroids, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "tag_id", referencedColumnName: "id" }])
  tag: TagsEntity;
}
