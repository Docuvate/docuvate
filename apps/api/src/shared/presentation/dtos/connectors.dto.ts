import type {
  ConnectorPluginId,
  CreateConnectorInstallationRequest,
} from '@docuvate/contracts';
import { IsIn, IsObject, IsString, MinLength } from 'class-validator';

const PLUGIN_IDS: ConnectorPluginId[] = [
  'gmail',
  'outlook',
  'paperless',
  'home_assistant',
  'amazon_s3',
];

export class ConnectorPluginIdParamDto {
  @IsIn(PLUGIN_IDS)
  pluginId!: ConnectorPluginId;
}

export class CreateConnectorInstallationRequestDto implements CreateConnectorInstallationRequest {
  @IsIn(PLUGIN_IDS)
  pluginId!: ConnectorPluginId;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsObject()
  credentials!: Record<string, string>;
}
