import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ConnectorInstallationIdParamDto {
  @IsUUID()
  installationId!: string;
}

export class ListConnectorImportablesQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ImportFromConnectorRequestDto {
  @IsString()
  ref!: string;
}

export class ExportToConnectorRequestDto {
  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsString()
  destinationRef?: string;
}

export class StartMailOAuthRequestDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  accountHint?: string;
}
