import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from './user.entity.js';

@Entity("user_preferences", { schema: "public" })
export class UserPreferencesEntity {
  @PrimaryColumn("text", { name: "user_id" })
  userId: string;

  @Column("text", {
    name: "preferred_extractor_engine",
    default: () => "'pipeline'",
  })
  preferredExtractorEngine: string;

  @Column("boolean", {
    name: "use_arena_winner_as_default",
    default: () => "false",
  })
  useArenaWinnerAsDefault: boolean;

  @Column("text", { name: "arena_winner_engine", nullable: true })
  arenaWinnerEngine: string | null;

  @Column("timestamp with time zone", {
    name: "updated_at",
    default: () => "now()",
  })
  updatedAt: Date;

  @Column("text", { name: "preferred_chat_provider", nullable: true })
  preferredChatProvider: string | null;

  @Column("real", {
    name: "label_field_confidence_threshold",
    precision: 24,
    default: () => "0.62",
  })
  labelFieldConfidenceThreshold: number;

  @Column("boolean", {
    name: "field_extraction_confidence_gate_enabled",
    default: () => "true",
  })
  fieldExtractionConfidenceGateEnabled: boolean;

  @Column("jsonb", { name: "field_extraction_required_label_ids", default: [] })
  fieldExtractionRequiredLabelIds: object;

  @Column("real", {
    name: "label_near_similarity_threshold",
    precision: 24,
    default: () => "0.62",
  })
  labelNearSimilarityThreshold: number;

  @Column("boolean", {
    name: "advanced_features_enabled",
    default: () => "false",
  })
  advancedFeaturesEnabled: boolean;

  @Column("text", {
    name: "theme_preference",
    default: () => "'system'",
  })
  themePreference: string;

  @Column("text", { name: "locale", nullable: true })
  locale: string | null;

  @OneToOne(() => UserEntity, (user) => user.userPreferences, { onDelete: "CASCADE", createForeignKeyConstraints: false })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;
}
