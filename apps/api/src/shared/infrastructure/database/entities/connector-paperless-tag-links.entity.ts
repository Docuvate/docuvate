import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ConnectorInstallationsEntity } from './connector-installations.entity.js';
import { TagsEntity } from './tags.entity.js';

@Entity('connector_paperless_tag_links', { schema: 'public' })
export class ConnectorPaperlessTagLinksEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('integer', { name: 'paperless_id' })
  paperlessId: number;

  @Column('uuid', { name: 'tag_id' })
  tagId: string;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;

  @ManyToOne(() => ConnectorInstallationsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'installation_id', referencedColumnName: 'id' }])
  installation: ConnectorInstallationsEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
