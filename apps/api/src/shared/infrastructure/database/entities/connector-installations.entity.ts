import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from './user.entity.js';

@Index(
  "connector_installations_user_id_plugin_id_key",
  ["pluginId", "userId"],
  { unique: true }
)
@Index("connector_installations_user_idx", ["userId"], {})
@Entity("connector_installations", { schema: "public" })
export class ConnectorInstallationsEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string;

  @Column("text", { name: "user_id", unique: true })
  userId: string;

  @Column("text", { name: "plugin_id", unique: true })
  pluginId: string;

  @Column("text", { name: "display_name" })
  displayName: string;

  @Column("boolean", { name: "enabled", default: () => "true" })
  enabled: boolean;

  @Column("bytea", { name: "credentials_encrypted" })
  credentialsEncrypted: Buffer;

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

  @ManyToOne(() => UserEntity, (user) => user.connectorInstallations, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: UserEntity;
}
