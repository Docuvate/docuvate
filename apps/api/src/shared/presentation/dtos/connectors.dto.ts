// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ConnectorPluginId,
  ConnectorSourceScopeDto,
  CreateConnectorInstallationRequest,
  UpdateConnectorInstallationRequest,
} from '@docuvate/contracts';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

const PLUGIN_IDS: ConnectorPluginId[] = [
  'gmail',
  'outlook',
  'paperless',
  'home_assistant',
  'amazon_s3',
  'sftp_fetch',
];

class ConnectorSourceScopeDtoClass implements ConnectorSourceScopeDto {
  @IsIn(['all', 'selected'])
  mode!: ConnectorSourceScopeDto['mode'];

  @IsString({ each: true })
  paths!: string[];
}

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

  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectorSourceScopeDtoClass)
  sourceScope?: ConnectorSourceScopeDto;
}

export class UpdateConnectorInstallationRequestDto implements UpdateConnectorInstallationRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectorSourceScopeDtoClass)
  sourceScope?: ConnectorSourceScopeDto;
}

export class ListConnectorSourceNodesQueryDto {
  @IsOptional()
  @IsString()
  parentPath?: string;
}

export class PreviewConnectorSourceNodesRequestDto {
  @IsObject()
  credentials!: Record<string, string>;

  @IsOptional()
  @IsString()
  parentPath?: string;
}
