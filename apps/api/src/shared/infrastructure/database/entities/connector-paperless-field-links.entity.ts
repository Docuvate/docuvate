import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('connector_paperless_field_links', { schema: 'public' })
export class ConnectorPaperlessFieldLinksEntity {
  @PrimaryColumn('uuid', { name: 'installation_id' })
  installationId: string;

  @PrimaryColumn('integer', { name: 'paperless_id' })
  paperlessId: number;

  @Column('uuid', { name: 'field_definition_id' })
  fieldDefinitionId: string;

  @Column('timestamp with time zone', { name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
