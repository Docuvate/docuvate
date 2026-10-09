import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('connector_paperless_correspondent_links', { schema: 'public' })
export class ConnectorPaperlessCorrespondentLinksEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('integer', { name: 'paperless_id' })
  paperlessId: number;

  @Column('uuid', { name: 'correspondent_id' })
  correspondentId: string;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
