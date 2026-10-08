import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from './user.entity.js';

@Index(
  "label_recommendation_blocklist_user_id_label_key_key",
  ["labelKey", "userId"],
  { unique: true }
)
@Entity("label_recommendation_blocklist", { schema: "public" })
export class LabelRecommendationBlocklistEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string;

  @Column("text", { name: "user_id", unique: true })
  userId: string;

  @Column("text", { name: "phrase" })
  phrase: string;

  @Column("text", { name: "label_key", unique: true })
  labelKey: string;

  @Column("text", { name: "source", default: () => "'manual'" })
  source: string;

  @Column("timestamp with time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.labelRecommendationBlocklists, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;
}
